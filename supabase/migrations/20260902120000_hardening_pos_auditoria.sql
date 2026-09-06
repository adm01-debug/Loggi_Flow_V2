-- Migration: 20260902120000_hardening_pos_auditoria
-- Correções da auditoria de 02/09/2026 (docs/audit/2026-09-02_auditoria_tecnica_22_dimensoes.md):
--   1. Partição audit_logs_y2027m07 nasceu sem policies (ensure_monthly_partition só criava
--      policies para rastreamento_historico) — cria as 2 policies espelhando as partições irmãs.
--   2. ensure_monthly_partition passa a criar as policies também para audit_logs.
--   3. Índices de cobertura para as 4 FKs sem índice.
--   4. Regras de negócio de frete deixam de ser legíveis por anon (public → authenticated).
--   5. Cron predict-delays-every-30min passa a se autenticar com service_role (a edge function
--      predict-delays-scheduled agora exige service_role ou secret interno).

-- ─── 1. Policies da partição y2027m07 (espelho de audit_logs_y2027m06) ───────
DO $$ BEGIN
  IF to_regclass('public.audit_logs_y2027m07') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins view audit logs" ON public.audit_logs_y2027m07';
    EXECUTE 'CREATE POLICY "Admins view audit logs" ON public.audit_logs_y2027m07 FOR SELECT TO authenticated USING (has_role(auth.uid(), ''admin''::app_role))';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated insert audit logs" ON public.audit_logs_y2027m07';
    EXECUTE 'CREATE POLICY "Authenticated insert audit logs" ON public.audit_logs_y2027m07 FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)';
  END IF;
END $$;

-- ─── 2. ensure_monthly_partition: policies também para audit_logs ────────────
CREATE OR REPLACE FUNCTION public.ensure_monthly_partition(p_parent text, p_year integer, p_month integer)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_child text;
  v_start date;
  v_end date;
BEGIN
  v_start := make_date(p_year, p_month, 1);
  v_end := (v_start + INTERVAL '1 month')::date;
  v_child := format('%s_y%sm%s', p_parent, p_year, lpad(p_month::text, 2, '0'));

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = v_child
  ) THEN
    EXECUTE format(
      'CREATE TABLE public.%I PARTITION OF public.%I FOR VALUES FROM (%L) TO (%L)',
      v_child, p_parent, v_start, v_end
    );
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_child);

    IF p_parent = 'audit_logs' THEN
      -- etapa 32: autovacuum agressivo padronizado nas particoes de audit_logs
      EXECUTE format('ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02)', v_child);
      -- auditoria 2026-09-02: particao sem policy = RLS nega tudo em consulta direta; espelha as irmas
      EXECUTE format(
        'CREATE POLICY "Admins view audit logs" ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role))',
        v_child
      );
      EXECUTE format(
        'CREATE POLICY "Authenticated insert audit logs" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)',
        v_child
      );
    END IF;

    IF p_parent = 'rastreamento_historico' THEN
      EXECUTE format(
        'CREATE POLICY "Admins can view tracking history y%sm%s" ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role))',
        p_year, lpad(p_month::text,2,'0'), v_child
      );
      EXECUTE format(
        'CREATE POLICY "Authenticated can insert tracking data" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)',
        v_child
      );
    END IF;
  END IF;

  RETURN v_child;
END;
$function$;

-- ─── 3. Índices de cobertura das FKs sem índice ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_index_proposals_proposed_by ON public.index_proposals (proposed_by);
CREATE INDEX IF NOT EXISTS idx_index_proposals_applied_by ON public.index_proposals (applied_by);
CREATE INDEX IF NOT EXISTS idx_remediation_actions_applied_by ON public.remediation_actions (applied_by);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_user_id ON public.scheduled_reports (user_id);

-- ─── 4. Regras de frete: leitura só para autenticados (eram legíveis por anon)
DROP POLICY IF EXISTS "Allow read for rules" ON public.freight_selection_rules;
CREATE POLICY "Allow read for rules" ON public.freight_selection_rules FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow read for mappings" ON public.freight_integration_mappings;
CREATE POLICY "Allow read for mappings" ON public.freight_integration_mappings FOR SELECT TO authenticated USING (true);

-- ─── 5. Crons de edge function com Authorization + x-internal-secret ─────────
-- Medido em 02/09: 54 respostas 401 "Missing authorization header" em ~6h — os crons
-- mandavam só apikey e o gateway das functions deployadas com verify_jwt exige JWT.
-- Validado na prática: a service_role_key do vault é uma sb_secret de outro projeto
-- ("Unregistered API key"); o anon JWT do vault é deste projeto e passa o gateway.
-- x-internal-secret (vault 'internal_fn_secret', criado fora desta migration por ser
-- segredo) autentica na camada in-code das functions quando INTERNAL_FN_SECRET estiver
-- setada no deploy — ver scripts/ops/pos_deploy_functions.sql.
DO $$
DECLARE _r record;
BEGIN
  FOR _r IN SELECT * FROM (VALUES
    ('predict-delays-every-30min','*/30 * * * *','/functions/v1/predict-delays-scheduled','{}'::text),
    ('db-regression-monitor-15m','*/15 * * * *','/functions/v1/db-regression-monitor','{}'),
    ('db-health-snapshot-hourly','0 * * * *','/functions/v1/db-health-snapshot?persist=true','{}'),
    ('db-health-weekly-report','0 8 * * 1','/functions/v1/db-health-weekly-report','{}'),
    ('accuracy-meta-monitor-daily','15 8 * * *','/functions/v1/accuracy-meta-monitor','{}'),
    ('accuracy-weekly-digest-monday','0 9 * * 1','/functions/v1/accuracy-weekly-digest','{"trigger":"cron"}'),
    ('rte-gateway-health-check','*/15 * * * *','/functions/v1/rodonaves-api','{"action":"health-all","persist":true}')
  ) AS v(job, sched, path, body) LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname=_r.job) THEN
      PERFORM cron.unschedule(_r.job);
    END IF;
    PERFORM cron.schedule(_r.job, _r.sched, format($fmt$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='project_url') || %L,
    headers := json_build_object(
      'Content-Type','application/json',
      'apikey',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='anon_key'),
      'Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='anon_key'),
      'x-internal-secret',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='internal_fn_secret')
    )::jsonb,
    body := %L::jsonb
  );
$fmt$, _r.path, _r.body));
  END LOOP;
END $$;

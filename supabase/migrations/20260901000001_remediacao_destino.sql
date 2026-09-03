-- Migration: 20260901000001_remediacao_destino
-- Remediações aplicadas ao destino em 31/08/2026 como parte do plano de migração (issue #35)
-- Fases 2 e 3 do plano: segurança P0 + paridade de schema

-- Etapa 26: enum notification_type
DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM ('info','success','warning','error','achievement');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE public.notifications ALTER COLUMN type DROP DEFAULT,
  ALTER COLUMN type TYPE public.notification_type USING type::public.notification_type,
  ALTER COLUMN type SET DEFAULT 'info'::public.notification_type;

-- Etapa 27: NOT NULL em colunas críticas
ALTER TABLE public.notifications ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN read SET NOT NULL, ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.comments ALTER COLUMN created_at SET NOT NULL, ALTER COLUMN updated_at SET NOT NULL;
ALTER TABLE public.fretes_internos ALTER COLUMN quantidade_itens SET NOT NULL, ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN xp_reward SET NOT NULL, ALTER COLUMN created_at SET NOT NULL, ALTER COLUMN updated_at SET NOT NULL;

-- Etapa 28: defaults em scheduled_reports
ALTER TABLE public.scheduled_reports ALTER COLUMN frequency SET DEFAULT 'weekly',
  ALTER COLUMN time_of_day SET DEFAULT '08:00:00', ALTER COLUMN filters SET DEFAULT '{}'::jsonb;

-- Etapa 29: constraints ausentes
DO $$ BEGIN
  ALTER TABLE public.comments ADD CONSTRAINT comments_entity_type_check
    CHECK ((entity_type = ANY (ARRAY['ocorrencia'::text,'coleta'::text,'entrega'::text,'frete_interno'::text])));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Etapa 30: índices geo_blocking
CREATE INDEX IF NOT EXISTS idx_geo_blocking_country_code ON public.geo_blocking_rules USING btree (country_code);
CREATE INDEX IF NOT EXISTS idx_geo_blocking_is_active ON public.geo_blocking_rules USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_geo_blocking_rules_created_by ON public.geo_blocking_rules USING btree (created_by);
CREATE INDEX IF NOT EXISTS idx_geo_blocking_settings_updated_by ON public.geo_blocking_settings USING btree (updated_by);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'unique_country_rule') THEN
    EXECUTE 'CREATE UNIQUE INDEX unique_country_rule ON public.geo_blocking_rules USING btree (country_code)';
    EXECUTE 'ALTER TABLE public.geo_blocking_rules ADD CONSTRAINT unique_country_rule UNIQUE USING INDEX unique_country_rule';
  END IF;
END $$;

-- Etapa 33: policies ausentes da origem
DROP POLICY IF EXISTS "Authenticated users can view clientes" ON public.clientes;
CREATE POLICY "Authenticated users can view clientes" ON public.clientes AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can view coletas" ON public.coletas;
CREATE POLICY "Authenticated users can view coletas" ON public.coletas AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));
DROP POLICY IF EXISTS "Authenticated users can view entregas" ON public.entregas;
CREATE POLICY "Authenticated users can view entregas" ON public.entregas AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() IS NOT NULL));
DROP POLICY IF EXISTS "Authenticated users can view fornecedores" ON public.fornecedores;
CREATE POLICY "Authenticated users can view fornecedores" ON public.fornecedores AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can view transportadoras" ON public.transportadoras;
CREATE POLICY "Authenticated users can view transportadoras" ON public.transportadoras AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;
CREATE POLICY "Users can view all comments" ON public.comments AS PERMISSIVE FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" ON public.notifications AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Admins can manage geo settings" ON public.geo_blocking_settings;
CREATE POLICY "Admins can manage geo settings" ON public.geo_blocking_settings AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can view geo settings" ON public.geo_blocking_settings;
CREATE POLICY "Admins can view geo settings" ON public.geo_blocking_settings AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can manage geo blocking rules" ON public.geo_blocking_rules;
CREATE POLICY "Admins can manage geo blocking rules" ON public.geo_blocking_rules AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins can view geo rules" ON public.geo_blocking_rules;
CREATE POLICY "Admins can view geo rules" ON public.geo_blocking_rules AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can create their own scheduled reports" ON public.scheduled_reports;
CREATE POLICY "Users can create their own scheduled reports" ON public.scheduled_reports AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can delete their own scheduled reports" ON public.scheduled_reports;
CREATE POLICY "Users can delete their own scheduled reports" ON public.scheduled_reports AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can update their own scheduled reports" ON public.scheduled_reports;
CREATE POLICY "Users can update their own scheduled reports" ON public.scheduled_reports AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view their own scheduled reports" ON public.scheduled_reports;
CREATE POLICY "Users can view their own scheduled reports" ON public.scheduled_reports AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));

-- Etapa 35: dropar triggers duplicados residuais
-- (replay-safe: DROP TRIGGER IF EXISTS falha se a TABELA nao existir — lalamove_orders foi removida no destino)
DO $$
DECLARE _t record;
BEGIN
  FOR _t IN SELECT * FROM (VALUES
    ('notify_ocorrencia_trigger','public.ocorrencias'),
    ('fretes_internos_updated_at','public.fretes_internos'),
    ('tr_cotacoes_multicanal_version','public.cotacoes_multicanal'),
    ('lalamove_orders_updated_at','public.lalamove_orders')
  ) AS v(trg, tbl) LOOP
    IF to_regclass(_t.tbl) IS NOT NULL THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON %s', _t.trg, _t.tbl);
    END IF;
  END LOOP;
END $$;

-- Etapa 49: corrigir alert_slow_queries()
CREATE OR REPLACE FUNCTION public.alert_slow_queries(threshold_ms numeric DEFAULT 1000)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE inserted int := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_stat_statements') THEN
    RETURN 0;
  END IF;
  EXECUTE format($f$
    INSERT INTO public.nexus_tactical_logs (type, message, event_time, metadata)
    SELECT 'SLOW_QUERY',
           'Slow query detected: ' || left(query, 200) || ' avg=' || round(mean_exec_time::numeric, 2) || 'ms calls=' || calls,
           now(),
           jsonb_build_object('mean_exec_time', mean_exec_time, 'calls', calls, 'level', 'crit', 'query', left(query, 500))
      FROM extensions.pg_stat_statements
     WHERE mean_exec_time > %s
       AND calls > 10
       AND query NOT LIKE '%%pg_stat_statements%%'
     ORDER BY mean_exec_time DESC
     LIMIT 20
  $f$, threshold_ms);
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$function$;

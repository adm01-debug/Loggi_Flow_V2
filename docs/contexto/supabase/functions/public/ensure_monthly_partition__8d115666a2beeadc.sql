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
$function$

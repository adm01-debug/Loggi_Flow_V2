
-- Fix: garantir partições de audit_logs para 2026 (jul-dez) antes de qualquer INSERT em tabelas com trigger de auditoria
DO $$
DECLARE
  m int;
BEGIN
  FOR m IN 7..12 LOOP
    PERFORM public.ensure_monthly_partition('audit_logs', 2026, m);
  END LOOP;
END $$;

-- Sprint 36: histórico de saúde do banco
CREATE TABLE IF NOT EXISTS public.db_health_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  active_connections int,
  total_connections int,
  db_size_bytes bigint,
  cache_hit_ratio numeric,
  deadlocks bigint,
  wal_size_bytes bigint,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

GRANT SELECT ON public.db_health_snapshots TO authenticated;
GRANT ALL ON public.db_health_snapshots TO service_role;

ALTER TABLE public.db_health_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='db_health_snapshots' AND policyname='Admins can view db health snapshots'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view db health snapshots" ON public.db_health_snapshots FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role))';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_db_health_snapshots_created_at_brin
  ON public.db_health_snapshots USING BRIN (created_at);

CREATE OR REPLACE FUNCTION public.cleanup_old_health_snapshots(days_to_keep int DEFAULT 30)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted int;
BEGIN
  DELETE FROM public.db_health_snapshots
   WHERE created_at < now() - (days_to_keep || ' days')::interval;
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_old_health_snapshots(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_health_snapshots(int) TO service_role;

-- Feature flags para Sprint 35
INSERT INTO public.feature_flags (key, is_enabled, description)
VALUES
  ('db_regression_alerts_enabled', true, 'Habilita monitor automático de regressões de query'),
  ('db_regression_threshold_pct', true, 'Threshold percentual para alerta de regressão (default 100)')
ON CONFLICT (key) DO NOTHING;

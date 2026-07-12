CREATE OR REPLACE FUNCTION public.get_transaction_health()
RETURNS TABLE(
  total_commits bigint,
  total_rollbacks bigint,
  rollback_ratio_pct numeric,
  deadlocks bigint,
  temp_files bigint,
  temp_bytes bigint,
  stats_since timestamptz,
  hours_since_reset numeric,
  rollbacks_per_hour numeric,
  severity text,
  recommendation text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_hours numeric;
  v_rate numeric;
  v_sev text;
  v_reco text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT
    COALESCE(sum(xact_commit),0),
    COALESCE(sum(xact_rollback),0),
    COALESCE(sum(deadlocks),0),
    COALESCE(sum(temp_files),0),
    COALESCE(sum(temp_bytes),0),
    min(stats_reset)
  INTO
    total_commits, total_rollbacks, deadlocks, temp_files, temp_bytes, stats_since
  FROM pg_stat_database
  WHERE datname = current_database();

  v_hours := GREATEST(EXTRACT(EPOCH FROM (now() - stats_since))/3600.0, 0.01);
  hours_since_reset := round(v_hours::numeric, 2);
  v_rate := total_rollbacks::numeric / v_hours;
  rollbacks_per_hour := round(v_rate, 2);
  rollback_ratio_pct := CASE WHEN (total_commits+total_rollbacks)>0
    THEN round(100.0 * total_rollbacks / (total_commits+total_rollbacks), 3)
    ELSE 0 END;

  IF v_rate > 100 THEN
    v_sev := 'critical';
    v_reco := 'Taxa alta de rollbacks. Investigar policies RLS, triggers e conflitos de aplicação em edge functions.';
  ELSIF v_rate > 20 THEN
    v_sev := 'warning';
    v_reco := 'Rollbacks elevados. Monitorar tendência e revisar mutations recentes.';
  ELSE
    v_sev := 'ok';
    v_reco := 'Taxa de rollbacks dentro do esperado.';
  END IF;

  severity := v_sev;
  recommendation := v_reco;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.get_transaction_health() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_transaction_health() TO authenticated, service_role;
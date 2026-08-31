
-- ============================================================
-- SPRINT 37: Real health metrics collector
-- ============================================================
CREATE OR REPLACE FUNCTION internal.collect_db_health()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = internal, public, pg_catalog
AS $$
DECLARE
  v_active int;
  v_total int;
  v_max int;
  v_db_size bigint;
  v_cache_ratio numeric;
  v_deadlocks bigint;
  v_wal_size bigint;
BEGIN
  SELECT count(*) FILTER (WHERE state = 'active'), count(*)
    INTO v_active, v_total
  FROM pg_stat_activity WHERE datname = current_database();

  SELECT setting::int INTO v_max FROM pg_settings WHERE name = 'max_connections';

  SELECT pg_database_size(current_database()) INTO v_db_size;

  SELECT round(
    (sum(blks_hit)::numeric / NULLIF(sum(blks_hit) + sum(blks_read), 0)) * 100, 2
  ) INTO v_cache_ratio
  FROM pg_stat_database WHERE datname = current_database();

  SELECT sum(deadlocks) INTO v_deadlocks
  FROM pg_stat_database WHERE datname = current_database();

  BEGIN
    SELECT sum(size) INTO v_wal_size FROM pg_ls_waldir();
  EXCEPTION WHEN OTHERS THEN v_wal_size := NULL; END;

  RETURN jsonb_build_object(
    'active_connections', v_active,
    'total_connections', v_total,
    'max_connections', v_max,
    'db_size_bytes', v_db_size,
    'cache_hit_ratio', v_cache_ratio,
    'deadlocks', v_deadlocks,
    'wal_size_bytes', v_wal_size,
    'collected_at', now()
  );
END; $$;

REVOKE ALL ON FUNCTION internal.collect_db_health() FROM PUBLIC;

-- Wrapper público para service_role/edge function persistir snapshots
CREATE OR REPLACE FUNCTION public.persist_db_health_snapshot()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, internal
AS $$
DECLARE
  v_metrics jsonb;
  v_id uuid;
BEGIN
  v_metrics := internal.collect_db_health();
  INSERT INTO public.db_health_snapshots (
    active_connections, total_connections, db_size_bytes,
    cache_hit_ratio, deadlocks, wal_size_bytes, metadata
  ) VALUES (
    (v_metrics->>'active_connections')::int,
    (v_metrics->>'total_connections')::int,
    (v_metrics->>'db_size_bytes')::bigint,
    (v_metrics->>'cache_hit_ratio')::numeric,
    (v_metrics->>'deadlocks')::bigint,
    (v_metrics->>'wal_size_bytes')::bigint,
    v_metrics
  ) RETURNING id INTO v_id;
  RETURN v_id;
END; $$;

REVOKE ALL ON FUNCTION public.persist_db_health_snapshot() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.persist_db_health_snapshot() TO service_role;

-- ============================================================
-- SPRINT 38: Anomaly detection (z-score on 7-day window)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_health_anomalies_fast()
RETURNS TABLE(
  metric text,
  current_value numeric,
  mean_value numeric,
  stddev_value numeric,
  z_score numeric,
  severity text,
  detected_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;

  RETURN QUERY
  WITH stats AS (
    SELECT
      avg(active_connections)::numeric AS mean_conn,
      stddev_samp(active_connections)::numeric AS std_conn,
      avg(cache_hit_ratio)::numeric AS mean_cache,
      stddev_samp(cache_hit_ratio)::numeric AS std_cache,
      avg(deadlocks)::numeric AS mean_dead,
      stddev_samp(deadlocks)::numeric AS std_dead
    FROM public.db_health_snapshots
    WHERE created_at > now() - interval '7 days'
      AND created_at < now() - interval '1 hour'
  ),
  latest AS (
    SELECT active_connections, cache_hit_ratio, deadlocks, created_at
    FROM public.db_health_snapshots
    ORDER BY created_at DESC LIMIT 1
  )
  SELECT * FROM (
    SELECT 'active_connections'::text, l.active_connections::numeric,
           s.mean_conn, s.std_conn,
           CASE WHEN s.std_conn > 0 THEN round(((l.active_connections - s.mean_conn) / s.std_conn)::numeric, 2) ELSE 0 END,
           CASE
             WHEN s.std_conn > 0 AND abs((l.active_connections - s.mean_conn) / s.std_conn) >= 3 THEN 'critical'
             WHEN s.std_conn > 0 AND abs((l.active_connections - s.mean_conn) / s.std_conn) >= 2 THEN 'warning'
             ELSE 'ok'
           END,
           l.created_at
    FROM latest l, stats s
    UNION ALL
    SELECT 'cache_hit_ratio', l.cache_hit_ratio,
           s.mean_cache, s.std_cache,
           CASE WHEN s.std_cache > 0 THEN round(((l.cache_hit_ratio - s.mean_cache) / s.std_cache)::numeric, 2) ELSE 0 END,
           CASE
             WHEN s.std_cache > 0 AND ((l.cache_hit_ratio - s.mean_cache) / s.std_cache) <= -3 THEN 'critical'
             WHEN s.std_cache > 0 AND ((l.cache_hit_ratio - s.mean_cache) / s.std_cache) <= -2 THEN 'warning'
             ELSE 'ok'
           END,
           l.created_at
    FROM latest l, stats s
    UNION ALL
    SELECT 'deadlocks', l.deadlocks::numeric,
           s.mean_dead, s.std_dead,
           CASE WHEN s.std_dead > 0 THEN round(((l.deadlocks - s.mean_dead) / s.std_dead)::numeric, 2) ELSE 0 END,
           CASE
             WHEN s.std_dead > 0 AND ((l.deadlocks - s.mean_dead) / s.std_dead) >= 3 THEN 'critical'
             WHEN s.std_dead > 0 AND ((l.deadlocks - s.mean_dead) / s.std_dead) >= 2 THEN 'warning'
             ELSE 'ok'
           END,
           l.created_at
    FROM latest l, stats s
  ) x;
END; $$;

REVOKE ALL ON FUNCTION public.get_health_anomalies_fast() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_health_anomalies_fast() TO authenticated;

-- ============================================================
-- SPRINT 39: Daily SLO rollup
-- ============================================================
CREATE TABLE IF NOT EXISTS public.db_slo_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day date NOT NULL UNIQUE,
  samples int NOT NULL,
  connection_slo_pct numeric NOT NULL,
  cache_slo_pct numeric NOT NULL,
  deadlock_free_pct numeric NOT NULL,
  overall_slo_pct numeric NOT NULL,
  computed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.db_slo_daily TO authenticated;
GRANT ALL ON public.db_slo_daily TO service_role;

ALTER TABLE public.db_slo_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view db slo daily"
ON public.db_slo_daily FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS db_slo_daily_day_idx ON public.db_slo_daily (day DESC);

CREATE OR REPLACE FUNCTION public.compute_db_slo_for(p_day date)
RETURNS public.db_slo_daily
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.db_slo_daily;
  v_samples int;
  v_conn numeric; v_cache numeric; v_dead numeric; v_overall numeric;
  v_conn_threshold int := 40; -- connections
  v_cache_threshold numeric := 95; -- %
BEGIN
  SELECT count(*) INTO v_samples
  FROM public.db_health_snapshots
  WHERE created_at >= p_day AND created_at < p_day + 1;

  IF v_samples = 0 THEN
    RETURN NULL;
  END IF;

  SELECT
    round(100.0 * count(*) FILTER (WHERE active_connections <= v_conn_threshold) / v_samples, 2),
    round(100.0 * count(*) FILTER (WHERE cache_hit_ratio >= v_cache_threshold) / v_samples, 2),
    round(100.0 * count(*) FILTER (WHERE COALESCE(deadlocks,0) = 0) / v_samples, 2)
  INTO v_conn, v_cache, v_dead
  FROM public.db_health_snapshots
  WHERE created_at >= p_day AND created_at < p_day + 1;

  v_overall := round((v_conn + v_cache + v_dead) / 3.0, 2);

  INSERT INTO public.db_slo_daily (day, samples, connection_slo_pct, cache_slo_pct, deadlock_free_pct, overall_slo_pct)
  VALUES (p_day, v_samples, v_conn, v_cache, v_dead, v_overall)
  ON CONFLICT (day) DO UPDATE SET
    samples = EXCLUDED.samples,
    connection_slo_pct = EXCLUDED.connection_slo_pct,
    cache_slo_pct = EXCLUDED.cache_slo_pct,
    deadlock_free_pct = EXCLUDED.deadlock_free_pct,
    overall_slo_pct = EXCLUDED.overall_slo_pct,
    computed_at = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END; $$;

REVOKE ALL ON FUNCTION public.compute_db_slo_for(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_db_slo_for(date) TO service_role;

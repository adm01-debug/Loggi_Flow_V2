CREATE OR REPLACE FUNCTION public.get_health_anomalies_fast()
 RETURNS TABLE(metric text, current_value numeric, mean_value numeric, stddev_value numeric, z_score numeric, severity text, detected_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
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
END; $function$

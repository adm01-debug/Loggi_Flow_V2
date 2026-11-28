CREATE OR REPLACE FUNCTION public.compute_db_slo_for(p_day date)
 RETURNS db_slo_daily
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
END; $function$

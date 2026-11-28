CREATE OR REPLACE FUNCTION public.get_autovacuum_health(p_limit integer DEFAULT 50)
 RETURNS TABLE(schema_name text, table_name text, live_tuples bigint, dead_tuples bigint, dead_pct numeric, last_vacuum timestamp with time zone, last_autovacuum timestamp with time zone, last_analyze timestamp with time zone, last_autoanalyze timestamp with time zone, days_since_vacuum numeric, vacuum_count bigint, autovacuum_count bigint, severity text, recommended_action text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  RETURN QUERY
  WITH s AS (
    SELECT
      schemaname::text AS sn,
      relname::text AS rn,
      n_live_tup AS lt,
      n_dead_tup AS dt,
      CASE WHEN (n_live_tup + n_dead_tup) > 0
           THEN round((n_dead_tup::numeric * 100.0) / (n_live_tup + n_dead_tup), 2)
           ELSE 0 END AS dp,
      last_vacuum AS lv,
      last_autovacuum AS lav,
      last_analyze AS la,
      last_autoanalyze AS laa,
      CASE WHEN GREATEST(COALESCE(last_vacuum,'epoch'::timestamptz),
                        COALESCE(last_autovacuum,'epoch'::timestamptz)) > 'epoch'::timestamptz
           THEN round(EXTRACT(EPOCH FROM (now() - GREATEST(COALESCE(last_vacuum,'epoch'::timestamptz),
                                                            COALESCE(last_autovacuum,'epoch'::timestamptz))))/86400.0, 1)
           ELSE NULL END AS dsv,
      vacuum_count AS vc,
      autovacuum_count AS avc
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
  )
  SELECT
    s.sn, s.rn, s.lt, s.dt, s.dp,
    s.lv, s.lav, s.la, s.laa, s.dsv, s.vc, s.avc,
    CASE
      WHEN s.dp >= 20 OR (s.dsv IS NOT NULL AND s.dsv >= 30) THEN 'critical'
      WHEN s.dp >= 10 OR (s.dsv IS NOT NULL AND s.dsv >= 7)  THEN 'warning'
      ELSE 'ok'
    END::text,
    CASE
      WHEN s.dp >= 20 THEN 'VACUUM (VERBOSE, ANALYZE) public.'||quote_ident(s.rn)||';'
      WHEN s.dp >= 10 THEN 'VACUUM ANALYZE public.'||quote_ident(s.rn)||';'
      WHEN s.dsv IS NOT NULL AND s.dsv >= 7 THEN 'ANALYZE public.'||quote_ident(s.rn)||';'
      ELSE 'sem ação'
    END::text
  FROM s
  WHERE s.lt + s.dt > 0
  ORDER BY
    CASE
      WHEN s.dp >= 20 OR (s.dsv IS NOT NULL AND s.dsv >= 30) THEN 0
      WHEN s.dp >= 10 OR (s.dsv IS NOT NULL AND s.dsv >= 7)  THEN 1
      ELSE 2
    END,
    s.dp DESC,
    s.dt DESC
  LIMIT p_limit;
END;
$function$

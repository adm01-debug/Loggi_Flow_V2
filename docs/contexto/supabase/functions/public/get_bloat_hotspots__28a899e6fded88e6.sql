CREATE OR REPLACE FUNCTION public.get_bloat_hotspots(p_min_dead_tuples bigint DEFAULT 1000, p_limit integer DEFAULT 25)
 RETURNS TABLE(schema_name text, table_name text, live_tuples bigint, dead_tuples bigint, dead_pct numeric, table_size_bytes bigint, estimated_bloat_bytes bigint, last_vacuum timestamp with time zone, last_autovacuum timestamp with time zone, last_analyze timestamp with time zone, vacuum_ddl text, severity text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    s.schemaname::text,
    s.relname::text,
    s.n_live_tup::bigint,
    s.n_dead_tup::bigint,
    CASE
      WHEN (s.n_live_tup + s.n_dead_tup) > 0
      THEN ROUND((s.n_dead_tup::numeric / (s.n_live_tup + s.n_dead_tup)) * 100, 2)
      ELSE 0
    END AS dead_pct,
    pg_total_relation_size(format('%I.%I', s.schemaname, s.relname)::regclass)::bigint,
    CASE
      WHEN (s.n_live_tup + s.n_dead_tup) > 0
      THEN (
        pg_total_relation_size(format('%I.%I', s.schemaname, s.relname)::regclass)::numeric
        * (s.n_dead_tup::numeric / (s.n_live_tup + s.n_dead_tup))
      )::bigint
      ELSE 0
    END AS estimated_bloat_bytes,
    s.last_vacuum,
    s.last_autovacuum,
    s.last_analyze,
    format('VACUUM (ANALYZE) %I.%I;', s.schemaname, s.relname)::text,
    CASE
      WHEN s.n_dead_tup >= 100000
        AND (s.n_live_tup + s.n_dead_tup) > 0
        AND (s.n_dead_tup::numeric / (s.n_live_tup + s.n_dead_tup)) >= 0.30 THEN 'critical'
      WHEN s.n_dead_tup >= 10000
        AND (s.n_live_tup + s.n_dead_tup) > 0
        AND (s.n_dead_tup::numeric / (s.n_live_tup + s.n_dead_tup)) >= 0.20 THEN 'warning'
      WHEN (s.n_live_tup + s.n_dead_tup) > 0
        AND (s.n_dead_tup::numeric / (s.n_live_tup + s.n_dead_tup)) >= 0.10 THEN 'info'
      ELSE 'ok'
    END::text
  FROM pg_stat_user_tables s
  WHERE s.schemaname = 'public'
    AND s.n_dead_tup >= p_min_dead_tuples
  ORDER BY s.n_dead_tup DESC
  LIMIT p_limit;
END;
$function$

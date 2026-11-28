CREATE OR REPLACE FUNCTION public.get_query_detail_fast(p_queryid bigint)
 RETURNS TABLE(queryid bigint, query_text text, calls bigint, total_exec_ms double precision, mean_exec_ms double precision, min_exec_ms double precision, max_exec_ms double precision, stddev_exec_ms double precision, rows_returned bigint, shared_blks_hit bigint, shared_blks_read bigint, cache_hit_pct numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'internal', 'public', 'extensions', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_stat_statements') THEN
    RETURN;
  END IF;

  RETURN QUERY EXECUTE format($f$
    SELECT s.queryid, s.query, s.calls,
           s.total_exec_time, s.mean_exec_time, s.min_exec_time,
           s.max_exec_time, s.stddev_exec_time, s.rows,
           s.shared_blks_hit, s.shared_blks_read,
           CASE WHEN (s.shared_blks_hit + s.shared_blks_read) > 0
                THEN ROUND(100.0 * s.shared_blks_hit / (s.shared_blks_hit + s.shared_blks_read), 2)
                ELSE NULL END
      FROM extensions.pg_stat_statements s
     WHERE s.queryid = %s
     LIMIT 1
  $f$, p_queryid);
END; $function$

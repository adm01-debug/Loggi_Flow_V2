CREATE OR REPLACE FUNCTION public.get_top_queries_fast(p_limit integer DEFAULT 10)
 RETURNS TABLE(queryid bigint, query_text text, calls bigint, mean_exec_ms double precision, total_exec_ms double precision, max_exec_ms double precision, rows_returned bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'internal', 'public', 'extensions', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
    RETURN;
  END IF;

  RETURN QUERY EXECUTE format($f$
    SELECT s.queryid,
           left(s.query, 500) AS query_text,
           s.calls,
           s.mean_exec_time,
           s.total_exec_time,
           s.max_exec_time,
           s.rows
      FROM extensions.pg_stat_statements s
     WHERE s.query NOT LIKE %L
     ORDER BY s.total_exec_time DESC
     LIMIT %s
  $f$, '%%pg_stat_statements%%', p_limit);
END;
$function$

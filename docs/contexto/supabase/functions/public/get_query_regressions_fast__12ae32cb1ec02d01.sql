CREATE OR REPLACE FUNCTION public.get_query_regressions_fast()
 RETURNS TABLE(queryid bigint, query_text text, baseline_mean_ms double precision, current_mean_ms double precision, regression_pct numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'internal', 'public', 'extensions', 'pg_catalog'
AS $function$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_stat_statements') THEN
    RETURN;
  END IF;

  RETURN QUERY EXECUTE $f$
    WITH latest AS (
      SELECT DISTINCT ON (queryid) queryid, query_text, mean_exec_time AS baseline
      FROM internal.query_baseline
      WHERE captured_at < now() - INTERVAL '1 day'
      ORDER BY queryid, captured_at DESC
    )
    SELECT s.queryid, left(s.query,500), l.baseline, s.mean_exec_time,
           round(((s.mean_exec_time - l.baseline) / NULLIF(l.baseline,0) * 100)::numeric, 2)
      FROM extensions.pg_stat_statements s
      JOIN latest l ON l.queryid = s.queryid
     WHERE s.mean_exec_time > l.baseline * 1.5
       AND s.calls > 10
     ORDER BY (s.mean_exec_time - l.baseline) DESC
     LIMIT 50
  $f$;
END; $function$

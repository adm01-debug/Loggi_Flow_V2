CREATE OR REPLACE FUNCTION public.get_table_coaccess_graph(p_limit integer DEFAULT 30)
 RETURNS TABLE(table_a text, table_b text, co_occurrences bigint, total_calls bigint, total_time_ms numeric, avg_mean_ms numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'access denied';
  END IF;

  RETURN QUERY
  WITH q AS (
    SELECT
      s.query,
      s.calls,
      s.total_exec_time,
      s.mean_exec_time
    FROM extensions.pg_stat_statements s
    JOIN pg_database d ON d.oid = s.dbid
    WHERE d.datname = current_database()
      AND s.query !~* '^\s*(begin|commit|rollback|set|show|explain)'
      AND s.calls >= 5
    ORDER BY s.total_exec_time DESC
    LIMIT 500
  ),
  tables_in_query AS (
    SELECT
      q.query,
      q.calls,
      q.total_exec_time,
      q.mean_exec_time,
      lower(m[1]) AS tbl
    FROM q,
    LATERAL regexp_matches(
      q.query,
      '(?:from|join|update|into)\s+(?:public\.)?"?([a-zA-Z_][a-zA-Z0-9_]*)"?',
      'gi'
    ) AS m
    WHERE lower(m[1]) IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
  ),
  distinct_pairs AS (
    SELECT DISTINCT
      t1.query,
      t1.calls,
      t1.total_exec_time,
      t1.mean_exec_time,
      LEAST(t1.tbl, t2.tbl) AS ta,
      GREATEST(t1.tbl, t2.tbl) AS tb
    FROM tables_in_query t1
    JOIN tables_in_query t2 ON t1.query = t2.query AND t1.tbl < t2.tbl
  )
  SELECT
    ta::text,
    tb::text,
    COUNT(*)::bigint AS co_occurrences,
    SUM(calls)::bigint AS total_calls,
    ROUND(SUM(total_exec_time)::numeric, 2) AS total_time_ms,
    ROUND(AVG(mean_exec_time)::numeric, 2) AS avg_mean_ms
  FROM distinct_pairs
  GROUP BY ta, tb
  ORDER BY total_time_ms DESC, co_occurrences DESC
  LIMIT p_limit;
END;
$function$

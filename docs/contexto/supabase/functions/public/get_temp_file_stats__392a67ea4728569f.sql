CREATE OR REPLACE FUNCTION public.get_temp_file_stats(p_limit integer DEFAULT 20)
 RETURNS TABLE(scope text, identifier text, temp_files bigint, temp_bytes bigint, calls bigint, mean_exec_ms numeric, query_text text, severity text, recommendation text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_catalog'
AS $function$
DECLARE
  v_db_files bigint;
  v_db_bytes bigint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT COALESCE(d.temp_files, 0), COALESCE(d.temp_bytes, 0)
    INTO v_db_files, v_db_bytes
    FROM pg_stat_database d WHERE d.datname = current_database();

  RETURN QUERY
  SELECT
    'database'::text,
    current_database()::text,
    v_db_files,
    v_db_bytes,
    NULL::bigint,
    NULL::numeric,
    NULL::text,
    CASE
      WHEN v_db_bytes >= 10::bigint * 1024 * 1024 * 1024 THEN 'critical'
      WHEN v_db_bytes >= 1::bigint  * 1024 * 1024 * 1024 THEN 'warning'
      WHEN v_db_bytes >= 100 * 1024 * 1024 THEN 'info'
      ELSE 'ok'
    END::text,
    CASE
      WHEN v_db_bytes >= 1::bigint * 1024 * 1024 * 1024
        THEN 'Volume alto de spill - aumente work_mem/maintenance_work_mem ou reduza sorts/hash joins.'
      WHEN v_db_bytes >= 100 * 1024 * 1024
        THEN 'Spill moderado - monitorar e ajustar work_mem se persistir.'
      ELSE 'Uso saudavel de arquivos temporarios.'
    END::text;

  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
    RETURN QUERY EXECUTE $f$
      SELECT
        'query'::text,
        s.queryid::text,
        s.temp_blks_read + s.temp_blks_written,
        (s.temp_blks_read + s.temp_blks_written) * 8192,
        s.calls,
        round(s.mean_exec_time::numeric, 2),
        left(s.query, 500),
        CASE
          WHEN (s.temp_blks_read + s.temp_blks_written) * 8192 >= 1::bigint * 1024 * 1024 * 1024 THEN 'critical'
          WHEN (s.temp_blks_read + s.temp_blks_written) * 8192 >= 100 * 1024 * 1024 THEN 'warning'
          ELSE 'info'
        END,
        'Query com spill: revise ORDER BY/GROUP BY, adicione indice cobrindo ordenacao, ou aumente work_mem por sessao.'
      FROM extensions.pg_stat_statements s
      WHERE (s.temp_blks_read + s.temp_blks_written) > 0
        AND s.query NOT ILIKE '%%pg_stat_statements%%'
      ORDER BY (s.temp_blks_read + s.temp_blks_written) DESC
      LIMIT $1
    $f$ USING p_limit;
  END IF;
END;
$function$

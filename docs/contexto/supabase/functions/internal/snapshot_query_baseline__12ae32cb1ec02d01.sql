CREATE OR REPLACE FUNCTION internal.snapshot_query_baseline()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'internal', 'public', 'extensions', 'pg_catalog'
AS $function$
DECLARE inserted int := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_stat_statements') THEN
    RETURN jsonb_build_object('status','skipped','reason','pg_stat_statements not installed');
  END IF;

  EXECUTE $f$
    INSERT INTO internal.query_baseline(queryid, query_text, calls, total_exec_time, mean_exec_time, rows_processed)
    SELECT queryid, left(query,500), calls, total_exec_time, mean_exec_time, rows
    FROM extensions.pg_stat_statements
    WHERE query NOT LIKE '%pg_stat_statements%'
      AND query NOT LIKE '%internal.query_baseline%'
    ORDER BY total_exec_time DESC
    LIMIT 50
  $f$;
  GET DIAGNOSTICS inserted = ROW_COUNT;

  -- keep last 90 days
  DELETE FROM internal.query_baseline WHERE captured_at < now() - INTERVAL '90 days';

  RETURN jsonb_build_object('status','ok','inserted', inserted, 'ran_at', now());
END; $function$

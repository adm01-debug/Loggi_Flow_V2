CREATE OR REPLACE FUNCTION public.alert_slow_queries(threshold_ms integer DEFAULT 500)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE inserted int := 0;
BEGIN
  -- Fails gracefully if pg_stat_statements is not installed
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_stat_statements') THEN
    RETURN 0;
  END IF;
  -- nexus_tactical_logs.type CHECK IN ('info','warn','crit'); module vai em metadata
  EXECUTE format($f$
    INSERT INTO public.nexus_tactical_logs (type, message, event_time, metadata)
    SELECT 'crit',
           'Slow query detected: ' || left(query, 200) || ' avg=' || round(mean_exec_time::numeric, 2) || 'ms calls=' || calls,
           now(),
           jsonb_build_object('module', 'SLOW_QUERY', 'mean_exec_time', mean_exec_time, 'calls', calls, 'query', left(query, 500))
      FROM extensions.pg_stat_statements
     WHERE mean_exec_time > %s
       AND calls > 10
       AND query NOT LIKE '%%pg_stat_statements%%'
     ORDER BY mean_exec_time DESC
     LIMIT 20
  $f$, threshold_ms);
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END; $function$

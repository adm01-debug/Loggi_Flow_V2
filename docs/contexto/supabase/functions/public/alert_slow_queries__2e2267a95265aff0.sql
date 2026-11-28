CREATE OR REPLACE FUNCTION public.alert_slow_queries(threshold_ms numeric DEFAULT 1000)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE inserted int := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_stat_statements') THEN
    RETURN 0;
  END IF;
  EXECUTE format($f$
    INSERT INTO public.nexus_tactical_logs (type, message, event_time, metadata)
    SELECT 'SLOW_QUERY',
           'Slow query detected: ' || left(query, 200) || ' avg=' || round(mean_exec_time::numeric, 2) || 'ms calls=' || calls,
           now(),
           jsonb_build_object('mean_exec_time', mean_exec_time, 'calls', calls, 'level', 'crit', 'query', left(query, 500))
      FROM extensions.pg_stat_statements
     WHERE mean_exec_time > %s
       AND calls > 10
       AND query NOT LIKE '%%pg_stat_statements%%'
     ORDER BY mean_exec_time DESC
     LIMIT 20
  $f$, threshold_ms);
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END;
$function$

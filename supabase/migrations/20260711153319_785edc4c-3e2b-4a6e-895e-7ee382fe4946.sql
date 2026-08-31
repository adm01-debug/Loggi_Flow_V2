
-- P23: system heartbeat every 5 minutes
CREATE OR REPLACE FUNCTION public.record_heartbeat()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.system_heartbeat (status, message, checked_at)
  VALUES ('healthy', 'auto-heartbeat', now());
  -- Keep only last 30 days
  DELETE FROM public.system_heartbeat WHERE checked_at < now() - INTERVAL '30 days';
END; $$;
REVOKE ALL ON FUNCTION public.record_heartbeat() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_heartbeat() TO service_role;

-- P18: slow query alerter (requires pg_stat_statements)
CREATE OR REPLACE FUNCTION public.alert_slow_queries(threshold_ms int DEFAULT 500)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE inserted int := 0;
BEGIN
  -- Fails gracefully if pg_stat_statements is not installed
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_stat_statements') THEN
    RETURN 0;
  END IF;
  EXECUTE format($f$
    INSERT INTO public.nexus_tactical_logs (module, level, message)
    SELECT 'SLOW_QUERY', 'crit',
           'Slow query detected: ' || left(query, 200) || ' avg=' || round(mean_exec_time::numeric, 2) || 'ms calls=' || calls
      FROM extensions.pg_stat_statements
     WHERE mean_exec_time > %s
       AND calls > 10
       AND query NOT LIKE '%%pg_stat_statements%%'
     ORDER BY mean_exec_time DESC
     LIMIT 20
  $f$, threshold_ms);
  GET DIAGNOSTICS inserted = ROW_COUNT;
  RETURN inserted;
END; $$;
REVOKE ALL ON FUNCTION public.alert_slow_queries(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.alert_slow_queries(int) TO service_role;

DO $$
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'nexus_heartbeat';
  PERFORM cron.schedule('nexus_heartbeat','*/5 * * * *', $CRON$ SELECT public.record_heartbeat(); $CRON$);
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'nexus_slow_queries';
  PERFORM cron.schedule('nexus_slow_queries','0 6 * * *', $CRON$ SELECT public.alert_slow_queries(500); $CRON$);
END $$;

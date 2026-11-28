CREATE OR REPLACE FUNCTION public.get_cron_jobs_status()
 RETURNS TABLE(jobid bigint, jobname text, schedule text, active boolean, last_start timestamp with time zone, last_status text, last_duration_ms numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'cron', 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RETURN;
  END IF;

  RETURN QUERY EXECUTE $f$
    WITH last_run AS (
      SELECT DISTINCT ON (jobid)
             jobid, start_time, status,
             EXTRACT(MILLISECOND FROM (end_time - start_time))::numeric AS duration_ms
        FROM cron.job_run_details
       ORDER BY jobid, start_time DESC
    )
    SELECT j.jobid, j.jobname, j.schedule, j.active,
           lr.start_time, lr.status, lr.duration_ms
      FROM cron.job j
      LEFT JOIN last_run lr ON lr.jobid = j.jobid
     ORDER BY j.jobname
  $f$;
END;
$function$

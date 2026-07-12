
-- Sprint 34: DB Observability RPCs (admin-only)

CREATE OR REPLACE FUNCTION public.get_top_queries_fast(p_limit int DEFAULT 10)
RETURNS TABLE(
  queryid bigint,
  query_text text,
  calls bigint,
  mean_exec_ms double precision,
  total_exec_ms double precision,
  max_exec_ms double precision,
  rows_returned bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = internal, public, extensions, pg_catalog
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.get_top_queries_fast(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_top_queries_fast(int) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_cron_jobs_status()
RETURNS TABLE(
  jobid bigint,
  jobname text,
  schedule text,
  active boolean,
  last_start timestamptz,
  last_status text,
  last_duration_ms numeric
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = cron, public, pg_catalog
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.get_cron_jobs_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_cron_jobs_status() TO authenticated;

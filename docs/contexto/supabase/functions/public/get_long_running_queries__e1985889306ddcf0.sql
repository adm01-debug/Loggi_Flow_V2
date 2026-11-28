CREATE OR REPLACE FUNCTION public.get_long_running_queries(p_min_seconds integer DEFAULT 30, p_limit integer DEFAULT 50)
 RETURNS TABLE(pid integer, usename text, application_name text, client_addr text, state text, wait_event_type text, wait_event text, query_start timestamp with time zone, duration_seconds numeric, query text, severity text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    a.pid,
    a.usename::text,
    a.application_name::text,
    host(a.client_addr)::text,
    a.state::text,
    a.wait_event_type::text,
    a.wait_event::text,
    a.query_start,
    EXTRACT(EPOCH FROM (now() - a.query_start))::numeric AS duration_seconds,
    a.query::text,
    CASE
      WHEN EXTRACT(EPOCH FROM (now() - a.query_start)) >= 300 THEN 'critical'
      WHEN EXTRACT(EPOCH FROM (now() - a.query_start)) >= 120 THEN 'warning'
      ELSE 'info'
    END AS severity
  FROM pg_stat_activity a
  WHERE a.pid <> pg_backend_pid()
    AND a.state <> 'idle'
    AND a.query_start IS NOT NULL
    AND a.query NOT ILIKE '%pg_stat_activity%'
    AND EXTRACT(EPOCH FROM (now() - a.query_start)) >= p_min_seconds
  ORDER BY a.query_start ASC
  LIMIT p_limit;
END;
$function$

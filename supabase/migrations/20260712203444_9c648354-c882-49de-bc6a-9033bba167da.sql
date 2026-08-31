
CREATE OR REPLACE FUNCTION public.get_long_running_queries(
  p_min_seconds integer DEFAULT 30,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  pid integer,
  usename text,
  application_name text,
  client_addr text,
  state text,
  wait_event_type text,
  wait_event text,
  query_start timestamptz,
  duration_seconds numeric,
  query text,
  severity text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.get_long_running_queries(integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_long_running_queries(integer, integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.cancel_long_running_query(
  p_pid integer,
  p_terminate boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_result boolean;
  v_query text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  IF p_pid IS NULL OR p_pid <= 0 THEN
    RAISE EXCEPTION 'Invalid PID';
  END IF;

  SELECT query INTO v_query FROM pg_stat_activity WHERE pid = p_pid;

  IF p_terminate THEN
    SELECT pg_terminate_backend(p_pid) INTO v_result;
  ELSE
    SELECT pg_cancel_backend(p_pid) INTO v_result;
  END IF;

  BEGIN
    INSERT INTO public.audit_logs (user_id, action, resource_type, record_id, metadata)
    VALUES (
      auth.uid(),
      CASE WHEN p_terminate THEN 'terminate_query' ELSE 'cancel_query' END,
      'pg_backend',
      p_pid::text,
      jsonb_build_object('pid', p_pid, 'terminate', p_terminate, 'success', v_result, 'query', left(coalesce(v_query, ''), 500))
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_long_running_query(integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_long_running_query(integer, boolean) TO authenticated;

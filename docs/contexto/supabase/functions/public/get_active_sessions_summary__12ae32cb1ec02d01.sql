CREATE OR REPLACE FUNCTION public.get_active_sessions_summary()
 RETURNS TABLE(state text, wait_event_type text, session_count bigint, oldest_session_seconds numeric, longest_query_seconds numeric, longest_xact_seconds numeric, sample_query text, severity text)
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
    COALESCE(a.state, 'unknown')::text,
    COALESCE(a.wait_event_type, 'none')::text,
    count(*)::bigint,
    ROUND(EXTRACT(EPOCH FROM (now() - min(a.backend_start)))::numeric, 1),
    ROUND(EXTRACT(EPOCH FROM (now() - min(a.query_start)))::numeric, 1),
    ROUND(EXTRACT(EPOCH FROM (now() - min(a.xact_start)))::numeric, 1),
    (array_agg(left(a.query, 200) ORDER BY a.query_start NULLS LAST))[1],
    CASE
      WHEN COALESCE(a.state,'') = 'idle in transaction'
        AND EXTRACT(EPOCH FROM (now() - min(a.xact_start))) > 300 THEN 'critical'
      WHEN COALESCE(a.state,'') = 'idle in transaction'
        AND EXTRACT(EPOCH FROM (now() - min(a.xact_start))) > 60 THEN 'warning'
      WHEN a.wait_event_type = 'Lock'
        AND EXTRACT(EPOCH FROM (now() - min(a.query_start))) > 30 THEN 'critical'
      WHEN COALESCE(a.state,'') = 'active'
        AND EXTRACT(EPOCH FROM (now() - min(a.query_start))) > 60 THEN 'warning'
      ELSE 'ok'
    END::text
  FROM pg_stat_activity a
  WHERE a.datname = current_database()
    AND a.pid <> pg_backend_pid()
    AND a.backend_type = 'client backend'
  GROUP BY a.state, a.wait_event_type
  ORDER BY count(*) DESC;
END;
$function$

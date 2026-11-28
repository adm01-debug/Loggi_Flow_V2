CREATE OR REPLACE FUNCTION public.get_lock_conflicts(p_limit integer DEFAULT 50)
 RETURNS TABLE(blocked_pid integer, blocked_user text, blocked_query text, blocked_duration_seconds numeric, blocking_pid integer, blocking_user text, blocking_query text, blocking_state text, lock_type text, lock_mode text, relation text, severity text)
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
    blocked.pid AS blocked_pid,
    blocked.usename::text AS blocked_user,
    left(blocked.query, 500)::text AS blocked_query,
    EXTRACT(EPOCH FROM (now() - blocked.query_start))::numeric AS blocked_duration_seconds,
    blocking.pid AS blocking_pid,
    blocking.usename::text AS blocking_user,
    left(blocking.query, 500)::text AS blocking_query,
    blocking.state::text AS blocking_state,
    bl.locktype::text AS lock_type,
    bl.mode::text AS lock_mode,
    COALESCE(bl.relation::regclass::text, '')::text AS relation,
    CASE
      WHEN EXTRACT(EPOCH FROM (now() - blocked.query_start)) >= 60 THEN 'critical'
      WHEN EXTRACT(EPOCH FROM (now() - blocked.query_start)) >= 15 THEN 'warning'
      ELSE 'info'
    END AS severity
  FROM pg_locks bl
  JOIN pg_stat_activity blocked ON blocked.pid = bl.pid
  JOIN LATERAL unnest(pg_blocking_pids(bl.pid)) AS blocking_pid_val(pid) ON true
  JOIN pg_stat_activity blocking ON blocking.pid = blocking_pid_val.pid
  WHERE NOT bl.granted
  ORDER BY blocked.query_start ASC
  LIMIT p_limit;
END;
$function$

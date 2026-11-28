CREATE OR REPLACE FUNCTION public.get_replication_status()
 RETURNS TABLE(pid integer, usename text, application_name text, client_addr text, state text, sync_state text, backend_start timestamp with time zone, write_lag_bytes bigint, flush_lag_bytes bigint, replay_lag_bytes bigint, total_lag_bytes bigint, write_lag_seconds numeric, flush_lag_seconds numeric, replay_lag_seconds numeric, severity text)
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
    r.pid,
    r.usename::text,
    r.application_name::text,
    host(r.client_addr)::text,
    r.state::text,
    r.sync_state::text,
    r.backend_start,
    COALESCE(pg_wal_lsn_diff(r.sent_lsn, r.write_lsn), 0)::bigint AS write_lag_bytes,
    COALESCE(pg_wal_lsn_diff(r.write_lsn, r.flush_lsn), 0)::bigint AS flush_lag_bytes,
    COALESCE(pg_wal_lsn_diff(r.flush_lsn, r.replay_lsn), 0)::bigint AS replay_lag_bytes,
    COALESCE(pg_wal_lsn_diff(r.sent_lsn, r.replay_lsn), 0)::bigint AS total_lag_bytes,
    COALESCE(EXTRACT(EPOCH FROM r.write_lag)::numeric, 0)  AS write_lag_seconds,
    COALESCE(EXTRACT(EPOCH FROM r.flush_lag)::numeric, 0)  AS flush_lag_seconds,
    COALESCE(EXTRACT(EPOCH FROM r.replay_lag)::numeric, 0) AS replay_lag_seconds,
    CASE
      WHEN r.state <> 'streaming' THEN 'critical'
      WHEN COALESCE(EXTRACT(EPOCH FROM r.replay_lag), 0) >= 60 THEN 'critical'
      WHEN COALESCE(EXTRACT(EPOCH FROM r.replay_lag), 0) >= 10 THEN 'warning'
      WHEN COALESCE(pg_wal_lsn_diff(r.sent_lsn, r.replay_lsn), 0) >= 16 * 1024 * 1024 THEN 'warning'
      ELSE 'ok'
    END::text AS severity
  FROM pg_stat_replication r
  ORDER BY r.backend_start ASC;
END;
$function$

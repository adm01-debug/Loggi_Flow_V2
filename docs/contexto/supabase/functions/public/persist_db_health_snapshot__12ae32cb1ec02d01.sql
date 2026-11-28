CREATE OR REPLACE FUNCTION public.persist_db_health_snapshot()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'internal'
AS $function$
DECLARE
  v_metrics jsonb;
  v_id uuid;
BEGIN
  v_metrics := internal.collect_db_health();
  INSERT INTO public.db_health_snapshots (
    active_connections, total_connections, db_size_bytes,
    cache_hit_ratio, deadlocks, wal_size_bytes, metadata
  ) VALUES (
    (v_metrics->>'active_connections')::int,
    (v_metrics->>'total_connections')::int,
    (v_metrics->>'db_size_bytes')::bigint,
    (v_metrics->>'cache_hit_ratio')::numeric,
    (v_metrics->>'deadlocks')::bigint,
    (v_metrics->>'wal_size_bytes')::bigint,
    v_metrics
  ) RETURNING id INTO v_id;
  RETURN v_id;
END; $function$

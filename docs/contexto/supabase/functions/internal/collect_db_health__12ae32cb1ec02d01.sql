CREATE OR REPLACE FUNCTION internal.collect_db_health()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'internal', 'public', 'pg_catalog'
AS $function$
DECLARE
  v_active int;
  v_total int;
  v_max int;
  v_db_size bigint;
  v_cache_ratio numeric;
  v_deadlocks bigint;
  v_wal_size bigint;
BEGIN
  SELECT count(*) FILTER (WHERE state = 'active'), count(*)
    INTO v_active, v_total
  FROM pg_stat_activity WHERE datname = current_database();

  SELECT setting::int INTO v_max FROM pg_settings WHERE name = 'max_connections';

  SELECT pg_database_size(current_database()) INTO v_db_size;

  SELECT round(
    (sum(blks_hit)::numeric / NULLIF(sum(blks_hit) + sum(blks_read), 0)) * 100, 2
  ) INTO v_cache_ratio
  FROM pg_stat_database WHERE datname = current_database();

  SELECT sum(deadlocks) INTO v_deadlocks
  FROM pg_stat_database WHERE datname = current_database();

  BEGIN
    SELECT sum(size) INTO v_wal_size FROM pg_ls_waldir();
  EXCEPTION WHEN OTHERS THEN v_wal_size := NULL; END;

  RETURN jsonb_build_object(
    'active_connections', v_active,
    'total_connections', v_total,
    'max_connections', v_max,
    'db_size_bytes', v_db_size,
    'cache_hit_ratio', v_cache_ratio,
    'deadlocks', v_deadlocks,
    'wal_size_bytes', v_wal_size,
    'collected_at', now()
  );
END; $function$

CREATE OR REPLACE FUNCTION public.get_wraparound_status(p_limit integer DEFAULT 50)
 RETURNS TABLE(schema_name text, table_name text, xid_age bigint, freeze_max_age bigint, pct_towards_wraparound numeric, last_autovacuum timestamp with time zone, table_size_bytes bigint, severity text, recommendation text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_freeze_max_age bigint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT setting::bigint INTO v_freeze_max_age
    FROM pg_settings WHERE name = 'autovacuum_freeze_max_age';
  IF v_freeze_max_age IS NULL THEN
    v_freeze_max_age := 200000000;
  END IF;

  RETURN QUERY
  SELECT
    n.nspname::text,
    c.relname::text,
    age(c.relfrozenxid)::bigint AS xid_age,
    v_freeze_max_age,
    ROUND((age(c.relfrozenxid)::numeric / v_freeze_max_age * 100), 2) AS pct,
    s.last_autovacuum,
    pg_total_relation_size(c.oid)::bigint AS size_bytes,
    CASE
      WHEN age(c.relfrozenxid) >= v_freeze_max_age * 0.9 THEN 'critical'
      WHEN age(c.relfrozenxid) >= v_freeze_max_age * 0.7 THEN 'warning'
      ELSE 'ok'
    END::text,
    CASE
      WHEN age(c.relfrozenxid) >= v_freeze_max_age * 0.9
        THEN format('VACUUM (FREEZE, VERBOSE) %I.%I; -- URGENTE: próximo ao wraparound', n.nspname, c.relname)
      WHEN age(c.relfrozenxid) >= v_freeze_max_age * 0.7
        THEN format('VACUUM FREEZE %I.%I; -- preventivo', n.nspname, c.relname)
      ELSE 'Sem ação necessária'
    END::text
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
  WHERE c.relkind IN ('r','m','t')
    AND n.nspname NOT IN ('pg_catalog','information_schema','pg_toast')
  ORDER BY age(c.relfrozenxid) DESC
  LIMIT p_limit;
END;
$function$

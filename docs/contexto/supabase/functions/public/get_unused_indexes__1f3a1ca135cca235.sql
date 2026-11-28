CREATE OR REPLACE FUNCTION public.get_unused_indexes(p_min_size_bytes bigint DEFAULT 1048576, p_limit integer DEFAULT 30)
 RETURNS TABLE(schema_name text, table_name text, index_name text, index_scans bigint, index_size_bytes bigint, table_size_bytes bigint, is_unique boolean, is_primary boolean, drop_ddl text, severity text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    s.schemaname::text,
    s.relname::text,
    s.indexrelname::text,
    s.idx_scan::bigint,
    pg_relation_size(s.indexrelid)::bigint,
    pg_total_relation_size(format('%I.%I', s.schemaname, s.relname)::regclass)::bigint,
    ix.indisunique,
    ix.indisprimary,
    format('DROP INDEX IF EXISTS %I.%I;', s.schemaname, s.indexrelname)::text,
    CASE
      WHEN s.idx_scan = 0 AND pg_relation_size(s.indexrelid) >= 10485760 THEN 'critical'
      WHEN s.idx_scan = 0 THEN 'warning'
      WHEN s.idx_scan < 50 THEN 'info'
      ELSE 'ok'
    END::text
  FROM pg_stat_user_indexes s
  JOIN pg_index ix ON ix.indexrelid = s.indexrelid
  WHERE s.schemaname = 'public'
    AND NOT ix.indisunique
    AND NOT ix.indisprimary
    AND pg_relation_size(s.indexrelid) >= p_min_size_bytes
    AND s.idx_scan < 50
  ORDER BY pg_relation_size(s.indexrelid) DESC
  LIMIT p_limit;
END;
$function$

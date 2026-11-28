CREATE OR REPLACE FUNCTION public.get_top_tables_by_size(p_limit integer DEFAULT 30)
 RETURNS TABLE(schema_name text, table_name text, total_bytes bigint, table_bytes bigint, indexes_bytes bigint, toast_bytes bigint, estimated_rows bigint, bytes_per_row numeric, severity text, recommendation text)
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
    n.nspname::text,
    c.relname::text,
    pg_total_relation_size(c.oid)::bigint,
    pg_relation_size(c.oid)::bigint,
    COALESCE(pg_indexes_size(c.oid), 0)::bigint,
    COALESCE(pg_total_relation_size(c.reltoastrelid), 0)::bigint,
    c.reltuples::bigint,
    CASE WHEN c.reltuples > 0
      THEN ROUND((pg_relation_size(c.oid)::numeric / c.reltuples::numeric), 1)
      ELSE 0::numeric
    END,
    CASE
      WHEN pg_total_relation_size(c.oid) >= 10::bigint * 1024 * 1024 * 1024 THEN 'critical'
      WHEN pg_total_relation_size(c.oid) >= 1::bigint * 1024 * 1024 * 1024 THEN 'warning'
      WHEN pg_total_relation_size(c.oid) >= 100 * 1024 * 1024 THEN 'info'
      ELSE 'ok'
    END::text,
    CASE
      WHEN pg_total_relation_size(c.oid) >= 10::bigint * 1024 * 1024 * 1024
        THEN 'Considere particionamento por data ou arquivamento em cold storage.'
      WHEN pg_total_relation_size(c.oid) >= 1::bigint * 1024 * 1024 * 1024
        AND COALESCE(pg_indexes_size(c.oid),0) > pg_relation_size(c.oid)
        THEN 'Indices maiores que a tabela - revise duplicados/redundantes.'
      WHEN pg_total_relation_size(c.oid) >= 1::bigint * 1024 * 1024 * 1024
        THEN 'Avalie VACUUM FULL, pg_repack ou retencao de dados historicos.'
      WHEN pg_total_relation_size(c.oid) >= 100 * 1024 * 1024
        THEN 'Monitorar crescimento; sem acao imediata.'
      ELSE 'Tamanho saudavel.'
    END::text
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'
    AND n.nspname = 'public'
  ORDER BY pg_total_relation_size(c.oid) DESC
  LIMIT p_limit;
END;
$function$

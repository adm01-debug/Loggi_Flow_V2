CREATE OR REPLACE FUNCTION public.get_duplicate_indexes(p_limit integer DEFAULT 30)
 RETURNS TABLE(schema_name text, table_name text, keep_index text, keep_columns text, keep_size_bytes bigint, keep_scans bigint, drop_index text, drop_columns text, drop_size_bytes bigint, drop_scans bigint, relationship text, drop_ddl text, severity text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  WITH idx AS (
    SELECT
      n.nspname::text  AS schema_name,
      c.relname::text  AS table_name,
      ic.relname::text AS index_name,
      i.indisunique    AS is_unique,
      i.indisprimary   AS is_primary,
      pg_relation_size(i.indexrelid)::bigint AS size_bytes,
      COALESCE(s.idx_scan, 0)::bigint        AS scans,
      (
        SELECT string_agg(a.attname, ',' ORDER BY k.ord)
        FROM unnest(i.indkey::int[]) WITH ORDINALITY k(attnum, ord)
        JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.attnum
      ) AS cols
    FROM pg_index i
    JOIN pg_class c  ON c.oid  = i.indrelid
    JOIN pg_class ic ON ic.oid = i.indexrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_stat_user_indexes s ON s.indexrelid = i.indexrelid
    WHERE n.nspname = 'public'
      AND i.indisvalid
      AND i.indpred IS NULL
  ),
  pairs AS (
    -- Duplicados exatos
    SELECT
      a.schema_name, a.table_name,
      CASE WHEN a.is_unique AND NOT b.is_unique THEN a.index_name
           WHEN b.is_unique AND NOT a.is_unique THEN b.index_name
           WHEN a.scans >= b.scans THEN a.index_name
           ELSE b.index_name END AS keep_name,
      CASE WHEN a.is_unique AND NOT b.is_unique THEN b.index_name
           WHEN b.is_unique AND NOT a.is_unique THEN a.index_name
           WHEN a.scans >= b.scans THEN b.index_name
           ELSE a.index_name END AS drop_name,
      a.cols AS a_cols, b.cols AS b_cols,
      a.size_bytes AS a_size, b.size_bytes AS b_size,
      a.scans AS a_scans, b.scans AS b_scans,
      a.is_primary OR b.is_primary AS any_primary,
      'exact_duplicate'::text AS relationship
    FROM idx a
    JOIN idx b
      ON a.schema_name = b.schema_name
     AND a.table_name  = b.table_name
     AND a.index_name  < b.index_name
     AND a.cols = b.cols

    UNION ALL

    -- Redundância por prefixo: b cobre o prefixo de a (mantém a, remove b)
    SELECT
      a.schema_name, a.table_name,
      a.index_name AS keep_name,
      b.index_name AS drop_name,
      a.cols, b.cols,
      a.size_bytes, b.size_bytes,
      a.scans, b.scans,
      a.is_primary OR b.is_primary,
      'prefix_redundant'::text
    FROM idx a
    JOIN idx b
      ON a.schema_name = b.schema_name
     AND a.table_name  = b.table_name
     AND a.index_name <> b.index_name
     AND NOT b.is_unique
     AND NOT b.is_primary
     AND a.cols LIKE b.cols || ',%'
  )
  SELECT
    p.schema_name,
    p.table_name,
    p.keep_name,
    CASE WHEN p.keep_name = (
      SELECT idx.index_name FROM idx WHERE idx.schema_name=p.schema_name AND idx.table_name=p.table_name AND idx.index_name=p.keep_name
    ) THEN
      (SELECT cols FROM idx WHERE idx.schema_name=p.schema_name AND idx.table_name=p.table_name AND idx.index_name=p.keep_name)
    ELSE '' END,
    (SELECT size_bytes FROM idx WHERE idx.schema_name=p.schema_name AND idx.table_name=p.table_name AND idx.index_name=p.keep_name),
    (SELECT scans FROM idx WHERE idx.schema_name=p.schema_name AND idx.table_name=p.table_name AND idx.index_name=p.keep_name),
    p.drop_name,
    (SELECT cols FROM idx WHERE idx.schema_name=p.schema_name AND idx.table_name=p.table_name AND idx.index_name=p.drop_name),
    (SELECT size_bytes FROM idx WHERE idx.schema_name=p.schema_name AND idx.table_name=p.table_name AND idx.index_name=p.drop_name),
    (SELECT scans FROM idx WHERE idx.schema_name=p.schema_name AND idx.table_name=p.table_name AND idx.index_name=p.drop_name),
    p.relationship,
    format('DROP INDEX IF EXISTS %I.%I;', p.schema_name, p.drop_name)::text,
    CASE
      WHEN p.relationship = 'exact_duplicate' AND p.a_size + p.b_size >= 10 * 1024 * 1024 THEN 'critical'
      WHEN p.relationship = 'exact_duplicate' THEN 'warning'
      WHEN p.b_size >= 10 * 1024 * 1024 THEN 'warning'
      ELSE 'info'
    END::text
  FROM pairs p
  ORDER BY p.a_size + p.b_size DESC
  LIMIT p_limit;
END;
$function$

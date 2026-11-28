CREATE OR REPLACE FUNCTION public.get_unindexed_foreign_keys()
 RETURNS TABLE(table_name text, constraint_name text, fk_columns text[], referenced_table text, table_size_bytes bigint, suggested_ddl text, severity text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;

  RETURN QUERY
  WITH fks AS (
    SELECT
      c.conrelid::regclass::text AS tbl,
      c.conname AS cname,
      c.conkey AS colnums,
      c.confrelid::regclass::text AS ref_tbl,
      c.conrelid,
      c.confrelid,
      n.nspname AS nsp
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
  ),
  fk_cols AS (
    SELECT
      f.tbl,
      f.cname,
      f.ref_tbl,
      f.conrelid,
      f.colnums,
      ARRAY(
        SELECT a.attname::text
        FROM unnest(f.colnums) WITH ORDINALITY AS u(attnum, ord)
        JOIN pg_attribute a ON a.attrelid = f.conrelid AND a.attnum = u.attnum
        ORDER BY u.ord
      )::text[] AS col_names
    FROM fks f
  )
  SELECT
    fc.tbl::text,
    fc.cname::text,
    fc.col_names,
    fc.ref_tbl::text,
    pg_total_relation_size(fc.conrelid)::bigint,
    format(
      'CREATE INDEX IF NOT EXISTS idx_%s_%s ON %s (%s);',
      regexp_replace(fc.tbl, '^public\.', ''),
      array_to_string(fc.col_names, '_'),
      fc.tbl,
      array_to_string(fc.col_names, ', ')
    )::text,
    CASE
      WHEN pg_total_relation_size(fc.conrelid) >= 104857600 THEN 'critical'
      WHEN pg_total_relation_size(fc.conrelid) >= 10485760 THEN 'warning'
      ELSE 'info'
    END::text
  FROM fk_cols fc
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_index ix
    WHERE ix.indrelid = fc.conrelid
      AND (ix.indkey::int2[])[0:array_length(fc.colnums, 1)-1] = fc.colnums
  )
  ORDER BY pg_total_relation_size(fc.conrelid) DESC;
END;
$function$

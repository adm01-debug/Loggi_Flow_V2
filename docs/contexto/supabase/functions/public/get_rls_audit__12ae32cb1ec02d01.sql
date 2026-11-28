CREATE OR REPLACE FUNCTION public.get_rls_audit()
 RETURNS TABLE(schema_name text, table_name text, rls_enabled boolean, policy_count integer, has_select_policy boolean, has_insert_policy boolean, has_update_policy boolean, has_delete_policy boolean, severity text, recommendation text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  WITH t AS (
    SELECT n.nspname AS schema_name, c.relname AS table_name,
           c.relrowsecurity AS rls_enabled, c.oid
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r' AND n.nspname = 'public'
  ),
  p AS (
    SELECT schemaname, tablename,
           count(*)::int AS pol_count,
           bool_or(cmd = 'SELECT' OR cmd = 'ALL') AS sel,
           bool_or(cmd = 'INSERT' OR cmd = 'ALL') AS ins,
           bool_or(cmd = 'UPDATE' OR cmd = 'ALL') AS upd,
           bool_or(cmd = 'DELETE' OR cmd = 'ALL') AS del
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY schemaname, tablename
  )
  SELECT
    t.schema_name::text,
    t.table_name::text,
    t.rls_enabled,
    COALESCE(p.pol_count, 0),
    COALESCE(p.sel, false),
    COALESCE(p.ins, false),
    COALESCE(p.upd, false),
    COALESCE(p.del, false),
    CASE
      WHEN NOT t.rls_enabled THEN 'critical'
      WHEN t.rls_enabled AND COALESCE(p.pol_count, 0) = 0 THEN 'warning'
      ELSE 'ok'
    END::text,
    CASE
      WHEN NOT t.rls_enabled
        THEN format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY; -- CRÍTICO', t.table_name)
      WHEN t.rls_enabled AND COALESCE(p.pol_count, 0) = 0
        THEN 'RLS ativo mas sem políticas — tabela inacessível via Data API. Adicione políticas ou desabilite RLS.'
      ELSE 'Configuração adequada.'
    END::text
  FROM t
  LEFT JOIN p ON p.schemaname = t.schema_name AND p.tablename = t.table_name
  ORDER BY
    CASE
      WHEN NOT t.rls_enabled THEN 0
      WHEN COALESCE(p.pol_count, 0) = 0 THEN 1
      ELSE 2
    END,
    t.table_name;
END;
$function$

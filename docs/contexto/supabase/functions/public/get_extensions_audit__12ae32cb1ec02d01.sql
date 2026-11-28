CREATE OR REPLACE FUNCTION public.get_extensions_audit()
 RETURNS TABLE(extension_name text, installed_version text, default_version text, schema_name text, is_relocatable boolean, update_available boolean, severity text, recommendation text)
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
    e.extname::text,
    e.extversion::text,
    av.default_version::text,
    n.nspname::text,
    e.extrelocatable,
    (av.default_version IS NOT NULL AND av.default_version <> e.extversion) AS update_available,
    CASE
      WHEN av.default_version IS NOT NULL AND av.default_version <> e.extversion THEN 'warning'
      ELSE 'ok'
    END::text,
    CASE
      WHEN av.default_version IS NOT NULL AND av.default_version <> e.extversion
        THEN format('ALTER EXTENSION %I UPDATE TO %L; -- de %s para %s',
                    e.extname, av.default_version, e.extversion, av.default_version)
      ELSE 'Atualizada.'
    END::text
  FROM pg_extension e
  JOIN pg_namespace n ON n.oid = e.extnamespace
  LEFT JOIN pg_available_extensions av ON av.name = e.extname
  ORDER BY (av.default_version IS NOT NULL AND av.default_version <> e.extversion) DESC,
           e.extname;
END;
$function$

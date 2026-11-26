-- Rollback de 20261126210000_remove_xp_for_level_sem_chamador.sql
-- Restaura a definicao que estava no banco oficial em 26/11 (LANGUAGE sql, IMMUTABLE,
-- search_path=public) e a ACL real: PUBLIC revogado, authenticated e service_role com EXECUTE.
CREATE OR REPLACE FUNCTION public.xp_for_level(lvl integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $function$
  SELECT (lvl - 1) * (lvl - 1) * 100;
$function$;

REVOKE EXECUTE ON FUNCTION public.xp_for_level(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.xp_for_level(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.xp_for_level(integer) TO service_role;
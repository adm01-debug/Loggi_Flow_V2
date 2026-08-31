-- Migration: 20260822190000_fix_record_heartbeat_columns
-- Corrige record_heartbeat() que tentava INSERT em colunas inexistentes;
-- migra para UPDATE SET last_check=now().
-- Revoga acesso de anon/authenticated (só service_role pode chamar).
-- Aplicada na origem em 22/08/2026; aplicada no destino via plano de migração (31/08/2026)
CREATE OR REPLACE FUNCTION public.record_heartbeat()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.system_heartbeat
     SET last_check = now()
   WHERE service_name IN ('database', 'edge_functions', 'storage', 'auth');
END;
$function$;

REVOKE ALL ON FUNCTION public.record_heartbeat() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_heartbeat() TO service_role;

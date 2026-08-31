-- Fix Search Path for Security Definer functions
ALTER FUNCTION public.update_carrier_ranking() SET search_path = public;

-- Revoke public execute from critical functions
REVOKE EXECUTE ON FUNCTION public.update_carrier_ranking() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_carrier_ranking() FROM anon;

-- Grant to authenticated users (or specific roles if needed)
GRANT EXECUTE ON FUNCTION public.update_carrier_ranking() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_carrier_ranking() TO service_role;

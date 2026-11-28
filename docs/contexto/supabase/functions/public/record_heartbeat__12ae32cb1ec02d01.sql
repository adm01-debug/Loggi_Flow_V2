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
END; $function$

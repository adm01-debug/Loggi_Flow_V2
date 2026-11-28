CREATE OR REPLACE FUNCTION public.cleanup_old_telemetry_logs()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    DELETE FROM public.telemetry_logs
    WHERE created_at < now() - INTERVAL '30 days';
END;
$function$

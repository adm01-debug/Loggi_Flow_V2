CREATE OR REPLACE FUNCTION public.cleanup_old_telemetry_logs(days_to_keep integer DEFAULT 30)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM public.telemetry_logs
    WHERE created_at < now() - (days_to_keep || ' days')::interval;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$function$

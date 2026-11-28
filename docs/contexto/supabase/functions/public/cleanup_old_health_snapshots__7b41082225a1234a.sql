CREATE OR REPLACE FUNCTION public.cleanup_old_health_snapshots(days_to_keep integer DEFAULT 30)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  deleted int;
BEGIN
  DELETE FROM public.db_health_snapshots
   WHERE created_at < now() - (days_to_keep || ' days')::interval;
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$function$

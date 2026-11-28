CREATE OR REPLACE FUNCTION public.purge_webhook_inbound_failures(_keep_days integer DEFAULT 90)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  removidas integer;
BEGIN
  DELETE FROM public.webhook_inbound_failures
   WHERE created_at < now() - make_interval(days => _keep_days);
  GET DIAGNOSTICS removidas = ROW_COUNT;
  RETURN removidas;
END;
$function$

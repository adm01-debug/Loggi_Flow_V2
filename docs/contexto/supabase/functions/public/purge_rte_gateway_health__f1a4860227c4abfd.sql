CREATE OR REPLACE FUNCTION public.purge_rte_gateway_health(retention_days integer DEFAULT 30)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  removed integer;
BEGIN
  IF retention_days IS NULL OR retention_days < 1 THEN
    retention_days := 30;
  END IF;

  DELETE FROM public.rte_gateway_health
  WHERE checked_at < now() - make_interval(days => retention_days);

  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$function$

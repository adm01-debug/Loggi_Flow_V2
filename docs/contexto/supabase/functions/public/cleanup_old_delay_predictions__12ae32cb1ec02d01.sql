CREATE OR REPLACE FUNCTION public.cleanup_old_delay_predictions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.delay_predictions_history
  WHERE predicted_at < now() - INTERVAL '90 days';
END;
$function$

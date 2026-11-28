CREATE OR REPLACE FUNCTION public.get_calibrated_tolerance(_transportadora text)
 RETURNS numeric
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    ROUND(AVG(ABS(actual_delay_hours - horas_estimadas_atraso))::numeric, 2),
    2.0
  )
  FROM public.delay_predictions_history
  WHERE confirmed_at IS NOT NULL
    AND transportadora = _transportadora
    AND predicted_at > now() - interval '60 days'
$function$

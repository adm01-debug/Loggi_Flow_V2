CREATE OR REPLACE FUNCTION public.mark_predictions_accurate()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_actual_delay_hours NUMERIC(6,2);
  v_tolerance NUMERIC(6,2);
BEGIN
  IF NEW.data_entrega_efetiva IS NOT NULL
     AND (OLD.data_entrega_efetiva IS NULL OR OLD.data_entrega_efetiva IS DISTINCT FROM NEW.data_entrega_efetiva)
     AND NEW.previsao_entrega IS NOT NULL THEN

    v_actual_delay_hours := GREATEST(0, EXTRACT(EPOCH FROM (NEW.data_entrega_efetiva - NEW.previsao_entrega)) / 3600.0);

    UPDATE public.delay_predictions_history dph
       SET confirmed_at = now(),
           actual_delay_hours = v_actual_delay_hours,
           was_accurate = (
             ABS(dph.horas_estimadas_atraso - v_actual_delay_hours)
             <= GREATEST(1.0, public.get_calibrated_tolerance(COALESCE(dph.transportadora, '')))
           )
     WHERE dph.entity_id = NEW.id
       AND dph.entity_type = 'entrega'
       AND dph.confirmed_at IS NULL;
  END IF;

  RETURN NEW;
END;
$function$

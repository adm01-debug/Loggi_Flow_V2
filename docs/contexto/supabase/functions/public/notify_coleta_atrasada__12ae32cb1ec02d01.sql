CREATE OR REPLACE FUNCTION public.notify_coleta_atrasada()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IN ('solicitada','em_transito')
     AND NEW.data_prevista_coleta IS NOT NULL
     AND NEW.data_prevista_coleta < NOW()
     AND NEW.data_efetiva_coleta IS NULL THEN
    INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
    SELECT DISTINCT ur.user_id,'Coleta Atrasada ⚠️',
      'A coleta ' || NEW.numero_coleta || ' está atrasada. Previsão era ' || TO_CHAR(NEW.data_prevista_coleta,'DD/MM/YYYY'),
      'warning'::public.notification_type,'/coletas',
      jsonb_build_object('coleta_id',NEW.id,'numero_coleta',NEW.numero_coleta,'event','coleta_atrasada')
    FROM user_roles ur;
  END IF;
  RETURN NEW;
END; $function$

CREATE OR REPLACE FUNCTION public.notify_entrega_atrasada()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status IN ('despachado','em_transito','saiu_entrega')
     AND NEW.previsao_entrega IS NOT NULL
     AND NEW.previsao_entrega < NOW()
     AND NEW.data_entrega_efetiva IS NULL
     AND NOT EXISTS (
       SELECT 1 FROM notifications
        WHERE metadata->>'entrega_id' = NEW.id::text
          AND metadata->>'event' = 'entrega_atrasada'
          AND created_at > NOW() - INTERVAL '24 hours'
     ) THEN
    INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
    SELECT DISTINCT ur.user_id,'Entrega Atrasada ⚠️',
      'A entrega ' || NEW.numero_entrega || ' está atrasada. Previsão era ' || TO_CHAR(NEW.previsao_entrega,'DD/MM/YYYY'),
      'warning'::public.notification_type,'/envios',
      jsonb_build_object('entrega_id',NEW.id,'numero_entrega',NEW.numero_entrega,
                         'previsao_entrega',NEW.previsao_entrega,'event','entrega_atrasada')
    FROM user_roles ur;
  END IF;
  RETURN NEW;
END; $function$

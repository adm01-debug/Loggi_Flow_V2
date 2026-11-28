CREATE OR REPLACE FUNCTION public.notify_entrega_concluida()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'entregue' AND (OLD.status IS NULL OR OLD.status <> 'entregue') THEN
    INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
    SELECT DISTINCT ur.user_id, 'Entrega Concluída! 🎉',
      'A entrega ' || NEW.numero_entrega || ' foi concluída com sucesso.',
      'success'::public.notification_type,'/envios',
      jsonb_build_object('entrega_id',NEW.id,'numero_entrega',NEW.numero_entrega,'event','entrega_concluida')
    FROM user_roles ur;
  END IF;
  RETURN NEW;
END; $function$

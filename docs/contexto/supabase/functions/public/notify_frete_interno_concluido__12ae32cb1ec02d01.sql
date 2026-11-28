CREATE OR REPLACE FUNCTION public.notify_frete_interno_concluido()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'entregue' AND (OLD.status IS NULL OR OLD.status <> 'entregue') THEN
    INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
    SELECT DISTINCT ur.user_id,'Frete Interno Concluído! ✅',
      'Frete de ' || NEW.origem || ' para ' || NEW.destino || ' foi entregue. +' || NEW.xp_reward || ' XP!',
      'success'::public.notification_type,'/fretes-internos',
      jsonb_build_object('frete_id',NEW.id,'origem',NEW.origem,'destino',NEW.destino,
                         'xp_reward',NEW.xp_reward,'event','frete_interno_concluido')
    FROM user_roles ur;
  END IF;
  RETURN NEW;
END; $function$

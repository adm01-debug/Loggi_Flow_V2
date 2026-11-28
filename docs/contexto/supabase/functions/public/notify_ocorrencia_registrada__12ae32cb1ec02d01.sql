CREATE OR REPLACE FUNCTION public.notify_ocorrencia_registrada()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_ref_numero text;
BEGIN
  IF NEW.entrega_id IS NOT NULL THEN
    SELECT numero_entrega INTO v_ref_numero FROM entregas WHERE id = NEW.entrega_id;
  ELSIF NEW.coleta_id IS NOT NULL THEN
    SELECT numero_coleta INTO v_ref_numero FROM coletas WHERE id = NEW.coleta_id;
  ELSE v_ref_numero := 'N/A';
  END IF;
  INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
  SELECT DISTINCT ur.user_id,'Nova Ocorrência Registrada 🚨',
    'Uma ocorrência do tipo "' || NEW.tipo_ocorrencia || '" foi registrada para ' || v_ref_numero,
    'error'::public.notification_type,'/ocorrencias',
    jsonb_build_object('ocorrencia_id',NEW.id,'tipo_ocorrencia',NEW.tipo_ocorrencia,
                       'entrega_id',NEW.entrega_id,'coleta_id',NEW.coleta_id,'event','ocorrencia_registrada')
  FROM user_roles ur;
  RETURN NEW;
END; $function$

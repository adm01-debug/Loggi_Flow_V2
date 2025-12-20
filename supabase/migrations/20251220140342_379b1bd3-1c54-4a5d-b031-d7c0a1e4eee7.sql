-- Create trigger function for delayed entregas
CREATE OR REPLACE FUNCTION public.notify_entrega_atrasada()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  -- Only trigger when entrega is in transit and past due date
  IF NEW.status IN ('despachado', 'em_transito', 'saiu_entrega') 
     AND NEW.previsao_entrega IS NOT NULL 
     AND NEW.previsao_entrega < NOW()
     AND NEW.data_entrega_efetiva IS NULL THEN
    
    FOR v_user_id IN SELECT DISTINCT user_id FROM user_roles
    LOOP
      -- Check if notification already exists for this entrega today
      IF NOT EXISTS (
        SELECT 1 FROM notifications 
        WHERE metadata->>'entrega_id' = NEW.id::text 
        AND metadata->>'event' = 'entrega_atrasada'
        AND created_at > NOW() - INTERVAL '24 hours'
      ) THEN
        INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
        VALUES (
          v_user_id,
          'Entrega Atrasada ⚠️',
          'A entrega ' || NEW.numero_entrega || ' está atrasada. Previsão era ' || TO_CHAR(NEW.previsao_entrega, 'DD/MM/YYYY'),
          'warning',
          '/envios',
          jsonb_build_object(
            'entrega_id', NEW.id,
            'numero_entrega', NEW.numero_entrega,
            'previsao_entrega', NEW.previsao_entrega,
            'event', 'entrega_atrasada'
          )
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on entregas table
DROP TRIGGER IF EXISTS trigger_notify_entrega_atrasada ON entregas;
CREATE TRIGGER trigger_notify_entrega_atrasada
  AFTER UPDATE ON entregas
  FOR EACH ROW
  EXECUTE FUNCTION notify_entrega_atrasada();

-- Also create triggers for existing functions that may be missing
DROP TRIGGER IF EXISTS trigger_notify_entrega_concluida ON entregas;
CREATE TRIGGER trigger_notify_entrega_concluida
  AFTER UPDATE ON entregas
  FOR EACH ROW
  EXECUTE FUNCTION notify_entrega_concluida();

DROP TRIGGER IF EXISTS trigger_notify_coleta_atrasada ON coletas;
CREATE TRIGGER trigger_notify_coleta_atrasada
  AFTER UPDATE ON coletas
  FOR EACH ROW
  EXECUTE FUNCTION notify_coleta_atrasada();

DROP TRIGGER IF EXISTS trigger_notify_ocorrencia ON ocorrencias;
CREATE TRIGGER trigger_notify_ocorrencia
  AFTER INSERT ON ocorrencias
  FOR EACH ROW
  EXECUTE FUNCTION notify_ocorrencia_registrada();

DROP TRIGGER IF EXISTS trigger_notify_frete_interno ON fretes_internos;
CREATE TRIGGER trigger_notify_frete_interno
  AFTER UPDATE ON fretes_internos
  FOR EACH ROW
  EXECUTE FUNCTION notify_frete_interno_concluido();

DROP TRIGGER IF EXISTS trigger_notify_conquista ON user_achievements;
CREATE TRIGGER trigger_notify_conquista
  AFTER INSERT ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION notify_conquista_desbloqueada();
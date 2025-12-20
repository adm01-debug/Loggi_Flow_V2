-- Function to create notification for delivery completed
CREATE OR REPLACE FUNCTION public.notify_entrega_concluida()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Only trigger when status changes to 'entregue'
  IF NEW.status = 'entregue' AND (OLD.status IS NULL OR OLD.status != 'entregue') THEN
    -- Get all users with roles to notify (simplified - notify all users)
    FOR v_user_id IN SELECT DISTINCT user_id FROM user_roles
    LOOP
      INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
      VALUES (
        v_user_id,
        'Entrega Concluída! 🎉',
        'A entrega ' || NEW.numero_entrega || ' foi concluída com sucesso.',
        'success',
        '/envios',
        jsonb_build_object(
          'entrega_id', NEW.id,
          'numero_entrega', NEW.numero_entrega,
          'event', 'entrega_concluida'
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to create notification for collection delayed
CREATE OR REPLACE FUNCTION public.notify_coleta_atrasada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Only trigger when status changes to a delayed-related status or when delivery date passed
  IF NEW.status IN ('solicitada', 'em_transito') 
     AND NEW.data_prevista_coleta IS NOT NULL 
     AND NEW.data_prevista_coleta < NOW()
     AND NEW.data_efetiva_coleta IS NULL THEN
    
    FOR v_user_id IN SELECT DISTINCT user_id FROM user_roles
    LOOP
      INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
      VALUES (
        v_user_id,
        'Coleta Atrasada ⚠️',
        'A coleta ' || NEW.numero_coleta || ' está atrasada. Previsão era ' || TO_CHAR(NEW.data_prevista_coleta, 'DD/MM/YYYY'),
        'warning',
        '/coletas',
        jsonb_build_object(
          'coleta_id', NEW.id,
          'numero_coleta', NEW.numero_coleta,
          'data_prevista', NEW.data_prevista_coleta,
          'event', 'coleta_atrasada'
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to create notification for achievement unlocked
CREATE OR REPLACE FUNCTION public.notify_conquista_desbloqueada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achievement RECORD;
BEGIN
  -- Get achievement details
  SELECT * INTO v_achievement FROM achievements WHERE id = NEW.achievement_id;
  
  IF FOUND THEN
    INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
    VALUES (
      NEW.user_id,
      'Conquista Desbloqueada! 🏆',
      'Você desbloqueou a conquista "' || v_achievement.name || '" e ganhou ' || v_achievement.xp_reward || ' XP e ' || v_achievement.coins_reward || ' moedas!',
      'achievement',
      '/conquistas',
      jsonb_build_object(
        'achievement_id', NEW.achievement_id,
        'achievement_name', v_achievement.name,
        'xp_reward', v_achievement.xp_reward,
        'coins_reward', v_achievement.coins_reward,
        'rarity', v_achievement.rarity,
        'event', 'conquista_desbloqueada'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to notify when delivery has an incident
CREATE OR REPLACE FUNCTION public.notify_ocorrencia_registrada()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_entrega RECORD;
  v_coleta RECORD;
  v_ref_numero text;
BEGIN
  -- Get reference number
  IF NEW.entrega_id IS NOT NULL THEN
    SELECT numero_entrega INTO v_ref_numero FROM entregas WHERE id = NEW.entrega_id;
  ELSIF NEW.coleta_id IS NOT NULL THEN
    SELECT numero_coleta INTO v_ref_numero FROM coletas WHERE id = NEW.coleta_id;
  ELSE
    v_ref_numero := 'N/A';
  END IF;
  
  FOR v_user_id IN SELECT DISTINCT user_id FROM user_roles
  LOOP
    INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
    VALUES (
      v_user_id,
      'Nova Ocorrência Registrada 🚨',
      'Uma ocorrência do tipo "' || NEW.tipo_ocorrencia || '" foi registrada para ' || v_ref_numero,
      'error',
      '/ocorrencias',
      jsonb_build_object(
        'ocorrencia_id', NEW.id,
        'tipo_ocorrencia', NEW.tipo_ocorrencia,
        'entrega_id', NEW.entrega_id,
        'coleta_id', NEW.coleta_id,
        'event', 'ocorrencia_registrada'
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Function to notify when internal freight is completed
CREATE OR REPLACE FUNCTION public.notify_frete_interno_concluido()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Only trigger when status changes to 'entregue'
  IF NEW.status = 'entregue' AND (OLD.status IS NULL OR OLD.status != 'entregue') THEN
    FOR v_user_id IN SELECT DISTINCT user_id FROM user_roles
    LOOP
      INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
      VALUES (
        v_user_id,
        'Frete Interno Concluído! ✅',
        'Frete de ' || NEW.origem || ' para ' || NEW.destino || ' foi entregue. +' || NEW.xp_reward || ' XP!',
        'success',
        '/fretes-internos',
        jsonb_build_object(
          'frete_id', NEW.id,
          'origem', NEW.origem,
          'destino', NEW.destino,
          'xp_reward', NEW.xp_reward,
          'event', 'frete_interno_concluido'
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers
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

DROP TRIGGER IF EXISTS trigger_notify_conquista ON user_achievements;
CREATE TRIGGER trigger_notify_conquista
  AFTER INSERT ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION notify_conquista_desbloqueada();

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
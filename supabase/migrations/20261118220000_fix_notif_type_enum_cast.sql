-- Fix: castar os literais de type para o enum public.notification_type nas trigger functions de notifications.
-- Causa: a migration 20260901000001 converteu notifications.type para o enum notification_type,
-- mas as trigger functions que inserem em notifications continuam usando literais text ('success', 'warning',
-- 'error', 'achievement'). Isso abortava com "column type is of type notification_type but expression is of
-- type text" em qualquer INSERT em ocorrencias/entregas/coletas/fretes_internos/conquistas (incluindo o seed).
-- Replay-safe: CREATE OR REPLACE FUNCTION. As triggers existentes continuam apontando pelo nome da função.

CREATE OR REPLACE FUNCTION public.notify_entrega_concluida()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END; $$;

CREATE OR REPLACE FUNCTION public.notify_coleta_atrasada()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END; $$;

CREATE OR REPLACE FUNCTION public.notify_ocorrencia_registrada()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END; $$;

CREATE OR REPLACE FUNCTION public.notify_frete_interno_concluido()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END; $$;

CREATE OR REPLACE FUNCTION public.notify_entrega_atrasada()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
END; $$;

CREATE OR REPLACE FUNCTION public.notify_conquista_desbloqueada()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_achievement RECORD;
BEGIN
  SELECT * INTO v_achievement FROM achievements WHERE id = NEW.achievement_id;
  IF FOUND THEN
    INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
    VALUES (
      NEW.user_id,
      'Conquista Desbloqueada! 🏆',
      'Você desbloqueou a conquista "' || v_achievement.name || '" e ganhou ' || v_achievement.xp_reward || ' XP e ' || v_achievement.coins_reward || ' moedas!',
      'achievement'::public.notification_type,
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
END; $$;

CREATE OR REPLACE FUNCTION public.notify_conquista_desbloqueada()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
END; $function$

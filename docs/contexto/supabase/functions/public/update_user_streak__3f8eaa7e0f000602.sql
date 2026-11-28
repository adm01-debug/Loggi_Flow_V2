CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_last_activity date;
  v_today date := current_date;
  v_new_streak integer;
BEGIN
  SELECT last_activity_date, streak_days INTO v_last_activity, v_new_streak
  FROM user_levels WHERE user_id = p_user_id;

  IF v_last_activity = v_today THEN RETURN; END IF;

  IF v_last_activity IS NULL THEN
    v_new_streak := 1;
  ELSIF v_today - v_last_activity = 1 THEN
    v_new_streak := v_new_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  UPDATE user_levels
  SET streak_days = v_new_streak, last_activity_date = v_today, updated_at = now()
  WHERE user_id = p_user_id;
END;
$function$

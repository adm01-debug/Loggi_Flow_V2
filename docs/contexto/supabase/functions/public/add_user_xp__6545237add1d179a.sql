CREATE OR REPLACE FUNCTION public.add_user_xp(p_user_id uuid, p_xp_amount integer, p_coins_amount integer DEFAULT 0)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_new_total_xp integer;
  v_new_level integer;
BEGIN
  IF p_xp_amount < 0 OR p_coins_amount < 0 THEN
    RAISE EXCEPTION 'XP and coins amounts must be non-negative';
  END IF;

  UPDATE user_levels
  SET
    current_xp = current_xp + p_xp_amount,
    total_xp = total_xp + p_xp_amount,
    coins = coins + p_coins_amount,
    level = calculate_level(total_xp + p_xp_amount),
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$function$

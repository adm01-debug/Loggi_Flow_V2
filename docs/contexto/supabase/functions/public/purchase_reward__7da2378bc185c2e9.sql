CREATE OR REPLACE FUNCTION public.purchase_reward(p_user_id uuid, p_reward_item_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_item RECORD;
  v_user_coins integer;
  v_purchase_id uuid;
BEGIN
  -- Lock the reward item row
  SELECT * INTO v_item FROM reward_items WHERE id = p_reward_item_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item não encontrado');
  END IF;
  IF NOT v_item.available THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item indisponível');
  END IF;
  IF v_item.stock IS NOT NULL AND v_item.stock <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item sem estoque');
  END IF;

  -- Lock user_levels row and check coins
  SELECT coins INTO v_user_coins FROM user_levels WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;
  IF v_user_coins < v_item.coins_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Moedas insuficientes');
  END IF;

  -- Debit coins
  UPDATE user_levels SET coins = coins - v_item.coins_cost, updated_at = now() WHERE user_id = p_user_id;

  -- Decrement stock if applicable
  IF v_item.stock IS NOT NULL THEN
    UPDATE reward_items SET stock = stock - 1 WHERE id = p_reward_item_id;
    -- Mark unavailable if stock reaches 0
    UPDATE reward_items SET available = false WHERE id = p_reward_item_id AND stock <= 0;
  END IF;

  -- Insert purchase record
  INSERT INTO reward_purchases (user_id, reward_item_id, coins_spent, status)
  VALUES (p_user_id, p_reward_item_id, v_item.coins_cost, 'purchased')
  RETURNING id INTO v_purchase_id;

  RETURN jsonb_build_object(
    'success', true,
    'purchase_id', v_purchase_id,
    'coins_spent', v_item.coins_cost,
    'remaining_coins', v_user_coins - v_item.coins_cost
  );
END;
$function$

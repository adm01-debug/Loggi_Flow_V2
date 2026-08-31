-- Migration: Add automatic XP triggers for gamification
-- This creates database triggers that automatically award XP when coletas/entregas are completed

-- XP values configuration
-- Coleta finalizada: 100 XP
-- Entrega finalizada: 150 XP
-- Frete interno finalizado: 50 XP

-- Function to add XP to user
CREATE OR REPLACE FUNCTION add_user_xp(p_user_id UUID, p_xp_amount INTEGER, p_coins_amount INTEGER DEFAULT 0)
RETURNS void AS $$
DECLARE
  v_current_xp INTEGER;
  v_total_xp INTEGER;
  v_new_level INTEGER;
  v_current_level INTEGER;
BEGIN
  -- Get current user level data
  SELECT current_xp, total_xp, level INTO v_current_xp, v_total_xp, v_current_level
  FROM user_levels
  WHERE user_id = p_user_id;

  -- If user doesn't have a level record yet, create one
  IF NOT FOUND THEN
    INSERT INTO user_levels (user_id, current_xp, total_xp, level, coins, streak_days)
    VALUES (p_user_id, p_xp_amount, p_xp_amount, 1, p_coins_amount, 1);
    RETURN;
  END IF;

  -- Calculate new total XP and level
  v_total_xp := v_total_xp + p_xp_amount;
  v_new_level := GREATEST(1, FLOOR(SQRT(v_total_xp / 100.0)) + 1);

  -- Update user level
  UPDATE user_levels
  SET 
    current_xp = current_xp + p_xp_amount,
    total_xp = v_total_xp,
    level = v_new_level,
    coins = coins + p_coins_amount,
    last_activity_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Check for level up and award bonus
  IF v_new_level > v_current_level THEN
    -- Award level up bonus: 50 coins per level
    UPDATE user_levels
    SET coins = coins + (50 * (v_new_level - v_current_level))
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for coletas
CREATE OR REPLACE FUNCTION trigger_coleta_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- Award XP when coleta is finalized
  IF NEW.status = 'finalizada' AND (OLD.status IS NULL OR OLD.status != 'finalizada') THEN
    -- Get the user who created/owns this coleta (using created_by or auth.uid())
    -- For now, we'll use a system approach - can be enhanced to track specific users
    PERFORM add_user_xp(
      COALESCE(NEW.created_by, auth.uid()),
      100, -- XP for coleta
      10   -- Coins for coleta
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for entregas
CREATE OR REPLACE FUNCTION trigger_entrega_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- Award XP when entrega is delivered
  IF NEW.status IN ('entregue', 'finalizado') AND (OLD.status IS NULL OR OLD.status NOT IN ('entregue', 'finalizado')) THEN
    PERFORM add_user_xp(
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID),
      150, -- XP for entrega
      15   -- Coins for entrega
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for fretes_internos
CREATE OR REPLACE FUNCTION trigger_frete_interno_xp()
RETURNS TRIGGER AS $$
BEGIN
  -- Award XP when frete interno is delivered
  IF NEW.status = 'entregue' AND (OLD.status IS NULL OR OLD.status != 'entregue') THEN
    PERFORM add_user_xp(
      COALESCE(NEW.created_by, auth.uid()),
      NEW.xp_reward, -- Use the configured XP reward
      5              -- Coins for frete interno
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers (drop if exist first to avoid errors)
DROP TRIGGER IF EXISTS coleta_xp_trigger ON coletas;
CREATE TRIGGER coleta_xp_trigger
  AFTER UPDATE ON coletas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_coleta_xp();

DROP TRIGGER IF EXISTS entrega_xp_trigger ON entregas;
CREATE TRIGGER entrega_xp_trigger
  AFTER UPDATE ON entregas
  FOR EACH ROW
  EXECUTE FUNCTION trigger_entrega_xp();

DROP TRIGGER IF EXISTS frete_interno_xp_trigger ON fretes_internos;
CREATE TRIGGER frete_interno_xp_trigger
  AFTER UPDATE ON fretes_internos
  FOR EACH ROW
  EXECUTE FUNCTION trigger_frete_interno_xp();

-- Add created_by column to coletas if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'coletas' AND column_name = 'created_by') THEN
    ALTER TABLE coletas ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_user_xp TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION add_user_xp IS 'Adds XP and coins to a user, automatically calculating level ups';
COMMENT ON FUNCTION trigger_coleta_xp IS 'Trigger function that awards XP when a coleta is finalized';
COMMENT ON FUNCTION trigger_entrega_xp IS 'Trigger function that awards XP when an entrega is delivered';
COMMENT ON FUNCTION trigger_frete_interno_xp IS 'Trigger function that awards XP when a frete interno is delivered';

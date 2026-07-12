
-- Sprint 20: ANALYZE + CHECK constraints para integridade de dados

-- 1) ANALYZE nas tabelas hot para atualizar estatísticas do planejador
ANALYZE public.entregas;
ANALYZE public.coletas;
ANALYZE public.notifications;
ANALYZE public.audit_logs;
ANALYZE public.user_sessions;
ANALYZE public.fretes_internos;
ANALYZE public.cotacoes_multicanal;
ANALYZE public.rate_limit_logs;
ANALYZE public.login_attempts;
ANALYZE public.user_levels;
ANALYZE public.reward_purchases;
ANALYZE public.transportadoras;
ANALYZE public.clientes;
ANALYZE public.fornecedores;
ANALYZE public.ocorrencias;

-- 2) CHECK constraints para garantir valores não-negativos em campos financeiros/gamificação
DO $$
BEGIN
  -- entregas.valor_frete >= 0
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'entregas_valor_frete_nonneg') THEN
    ALTER TABLE public.entregas
      ADD CONSTRAINT entregas_valor_frete_nonneg
      CHECK (valor_frete IS NULL OR valor_frete >= 0) NOT VALID;
  END IF;

  -- cotacoes_multicanal.valor_cotado >= 0
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cotacoes_multicanal_valor_nonneg') THEN
    ALTER TABLE public.cotacoes_multicanal
      ADD CONSTRAINT cotacoes_multicanal_valor_nonneg
      CHECK (valor_cotado IS NULL OR valor_cotado >= 0) NOT VALID;
  END IF;

  -- user_levels.coins >= 0
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_levels_coins_nonneg') THEN
    ALTER TABLE public.user_levels
      ADD CONSTRAINT user_levels_coins_nonneg
      CHECK (coins >= 0) NOT VALID;
  END IF;

  -- user_levels.total_xp >= 0
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_levels_total_xp_nonneg') THEN
    ALTER TABLE public.user_levels
      ADD CONSTRAINT user_levels_total_xp_nonneg
      CHECK (total_xp >= 0) NOT VALID;
  END IF;

  -- user_levels.level >= 1
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_levels_level_min') THEN
    ALTER TABLE public.user_levels
      ADD CONSTRAINT user_levels_level_min
      CHECK (level >= 1) NOT VALID;
  END IF;

  -- reward_purchases.coins_spent >= 0
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reward_purchases_coins_nonneg') THEN
    ALTER TABLE public.reward_purchases
      ADD CONSTRAINT reward_purchases_coins_nonneg
      CHECK (coins_spent >= 0) NOT VALID;
  END IF;

  -- reward_items.coins_cost >= 0
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reward_items_cost_nonneg') THEN
    ALTER TABLE public.reward_items
      ADD CONSTRAINT reward_items_cost_nonneg
      CHECK (coins_cost >= 0) NOT VALID;
  END IF;

  -- fretes_internos.xp_reward >= 0
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fretes_internos_xp_nonneg') THEN
    ALTER TABLE public.fretes_internos
      ADD CONSTRAINT fretes_internos_xp_nonneg
      CHECK (xp_reward IS NULL OR xp_reward >= 0) NOT VALID;
  END IF;

  -- achievements.xp_reward / coins_reward >= 0
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'achievements_rewards_nonneg') THEN
    ALTER TABLE public.achievements
      ADD CONSTRAINT achievements_rewards_nonneg
      CHECK (xp_reward >= 0 AND coins_reward >= 0) NOT VALID;
  END IF;

  -- coletas.qtd_volumes >= 0
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'coletas_qtd_volumes_nonneg') THEN
    ALTER TABLE public.coletas
      ADD CONSTRAINT coletas_qtd_volumes_nonneg
      CHECK (qtd_volumes IS NULL OR qtd_volumes >= 0) NOT VALID;
  END IF;
END $$;

-- 3) Validar constraints previamente marcadas NOT VALID (não bloqueia inserts se dados históricos violarem)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conrelid::regclass::text AS tbl, conname
    FROM pg_constraint
    WHERE contype = 'c'
      AND NOT convalidated
      AND connamespace = 'public'::regnamespace
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %s VALIDATE CONSTRAINT %I', r.tbl, r.conname);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipping validation of % on %: %', r.conname, r.tbl, SQLERRM;
    END;
  END LOOP;
END $$;

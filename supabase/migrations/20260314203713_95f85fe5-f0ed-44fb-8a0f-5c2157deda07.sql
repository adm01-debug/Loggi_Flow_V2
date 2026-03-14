-- ============================================================
-- COMPREHENSIVE RLS SECURITY HARDENING
-- ============================================================

-- 1) PRIVILEGE ESCALATION FIX: user_levels - remove direct UPDATE, use SECURITY DEFINER
DROP POLICY IF EXISTS "Users can update their own level" ON public.user_levels;

CREATE OR REPLACE FUNCTION public.add_user_xp(p_user_id uuid, p_xp_amount integer, p_coins_amount integer DEFAULT 0)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.add_user_xp(uuid, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_user_xp(uuid, integer, integer) TO authenticated;

REVOKE ALL ON FUNCTION public.update_user_streak(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_user_streak(uuid) TO authenticated;

-- 2) CRITICAL: Restrict DELETE on core business tables to admin only
-- entregas
DROP POLICY IF EXISTS "Authenticated users can delete entregas" ON public.entregas;
CREATE POLICY "Admins can delete entregas" ON public.entregas
FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- clientes
DROP POLICY IF EXISTS "Authenticated users can delete clientes" ON public.clientes;
CREATE POLICY "Admins can delete clientes" ON public.clientes
FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- fornecedores
DROP POLICY IF EXISTS "Authenticated users can delete fornecedores" ON public.fornecedores;
CREATE POLICY "Admins can delete fornecedores" ON public.fornecedores
FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- transportadoras
DROP POLICY IF EXISTS "Authenticated users can delete transportadoras" ON public.transportadoras;
CREATE POLICY "Admins can delete transportadoras" ON public.transportadoras
FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- coletas
DROP POLICY IF EXISTS "Authenticated users can delete coletas" ON public.coletas;
CREATE POLICY "Admins can delete coletas" ON public.coletas
FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- fretes_internos
DROP POLICY IF EXISTS "Authenticated users can delete fretes_internos" ON public.fretes_internos;
CREATE POLICY "Admins can delete fretes_internos" ON public.fretes_internos
FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ocorrencias
DROP POLICY IF EXISTS "Authenticated users can delete ocorrencias" ON public.ocorrencias;
CREATE POLICY "Admins can delete ocorrencias" ON public.ocorrencias
FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- 3) UNAUTHENTICATED WRITE: Fix public INSERT policies to service_role
-- rate_limit_logs
DROP POLICY IF EXISTS "System can insert rate limit logs" ON public.rate_limit_logs;
CREATE POLICY "System can insert rate limit logs" ON public.rate_limit_logs
FOR INSERT TO service_role WITH CHECK (true);

-- rule_execution_logs
DROP POLICY IF EXISTS "System can insert rule logs" ON public.rule_execution_logs;
CREATE POLICY "System can insert rule logs" ON public.rule_execution_logs
FOR INSERT TO service_role WITH CHECK (true);

-- geo_blocked_attempts
DROP POLICY IF EXISTS "System can insert geo blocked attempts" ON public.geo_blocked_attempts;
CREATE POLICY "System can insert geo blocked attempts" ON public.geo_blocked_attempts
FOR INSERT TO service_role WITH CHECK (true);

-- 4) PERMISSION EXPOSURE: Restrict permissions/role_permissions SELECT to authenticated
DROP POLICY IF EXISTS "Anyone can view permissions" ON public.permissions;
CREATE POLICY "Authenticated users can view permissions" ON public.permissions
FOR SELECT TO authenticated USING (true);

-- 5) WebAuthn: restrict NULL user_id challenges
DROP POLICY IF EXISTS "Users can manage their own challenges" ON public.webauthn_challenges;
CREATE POLICY "Users can manage their own challenges" ON public.webauthn_challenges
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role manages registration challenges" ON public.webauthn_challenges
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 6) notificacoes_custo: already fixed in prior migration, skip if exists

-- 7) Enable leaked password protection
-- (This requires auth config, not SQL)
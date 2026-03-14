
-- Fix overly permissive RLS policies on critical tables
-- These tables currently allow anonymous access with USING(true)

-- 1. alertas_custo: Replace open policy with authenticated-only
DROP POLICY IF EXISTS "Allow all access to alertas_custo" ON public.alertas_custo;
CREATE POLICY "Authenticated users can manage alertas_custo" ON public.alertas_custo
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. tabelas_frete: Replace open policy with authenticated-only
DROP POLICY IF EXISTS "Allow all access to tabelas_frete" ON public.tabelas_frete;
CREATE POLICY "Authenticated users can manage tabelas_frete" ON public.tabelas_frete
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. cotacoes_frete: Replace open policy with authenticated-only
DROP POLICY IF EXISTS "Allow all access to cotacoes_frete" ON public.cotacoes_frete;
CREATE POLICY "Authenticated users can manage cotacoes_frete" ON public.cotacoes_frete
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. transportadora_rotas: Replace open policy with authenticated-only
DROP POLICY IF EXISTS "Allow all access to transportadora_rotas" ON public.transportadora_rotas;
CREATE POLICY "Authenticated users can manage transportadora_rotas" ON public.transportadora_rotas
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. geo_blocked_attempts: Add system INSERT policy (needed to log blocked attempts)
CREATE POLICY "System can insert geo blocked attempts" ON public.geo_blocked_attempts
  FOR INSERT TO public
  WITH CHECK (true);

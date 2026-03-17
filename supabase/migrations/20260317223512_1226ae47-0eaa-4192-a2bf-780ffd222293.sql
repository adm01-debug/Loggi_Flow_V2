
-- =====================================================
-- FIX ALL PERMISSIVE RLS POLICIES & ADD MISSING ONES
-- =====================================================

-- 1. CLIENTES: Replace true with auth.uid() IS NOT NULL
DROP POLICY IF EXISTS "Authenticated users can insert clientes" ON public.clientes;
DROP POLICY IF EXISTS "Authenticated users can update clientes" ON public.clientes;

CREATE POLICY "Auth users can insert clientes" ON public.clientes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update clientes" ON public.clientes
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 2. COLETAS: Replace true with auth.uid() IS NOT NULL
DROP POLICY IF EXISTS "Authenticated users can insert coletas" ON public.coletas;
DROP POLICY IF EXISTS "Authenticated users can update coletas" ON public.coletas;

CREATE POLICY "Auth users can insert coletas" ON public.coletas
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update coletas" ON public.coletas
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 3. ENTREGAS: Replace true with auth.uid() IS NOT NULL
DROP POLICY IF EXISTS "Authenticated users can insert entregas" ON public.entregas;
DROP POLICY IF EXISTS "Authenticated users can update entregas" ON public.entregas;

CREATE POLICY "Auth users can insert entregas" ON public.entregas
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update entregas" ON public.entregas
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 4. FORNECEDORES: Replace true with auth.uid() IS NOT NULL
DROP POLICY IF EXISTS "Authenticated users can insert fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Authenticated users can update fornecedores" ON public.fornecedores;

CREATE POLICY "Auth users can insert fornecedores" ON public.fornecedores
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update fornecedores" ON public.fornecedores
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 5. TRANSPORTADORAS: Replace true with auth.uid() IS NOT NULL
DROP POLICY IF EXISTS "Authenticated users can insert transportadoras" ON public.transportadoras;
DROP POLICY IF EXISTS "Authenticated users can update transportadoras" ON public.transportadoras;

CREATE POLICY "Auth users can insert transportadoras" ON public.transportadoras
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update transportadoras" ON public.transportadoras
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- 6. TABELAS_FRETE: Replace ALL true with specific ops
DROP POLICY IF EXISTS "Authenticated users can manage tabelas_frete" ON public.tabelas_frete;

CREATE POLICY "Auth users can view tabelas_frete" ON public.tabelas_frete
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can insert tabelas_frete" ON public.tabelas_frete
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update tabelas_frete" ON public.tabelas_frete
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete tabelas_frete" ON public.tabelas_frete
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 7. TRANSPORTADORA_ROTAS: Replace ALL true with specific ops
DROP POLICY IF EXISTS "Authenticated users can manage transportadora_rotas" ON public.transportadora_rotas;

CREATE POLICY "Auth users can view transportadora_rotas" ON public.transportadora_rotas
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can insert transportadora_rotas" ON public.transportadora_rotas
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update transportadora_rotas" ON public.transportadora_rotas
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete transportadora_rotas" ON public.transportadora_rotas
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 8. COTACOES_FRETE: Replace ALL true with specific ops
DROP POLICY IF EXISTS "Authenticated users can manage cotacoes_frete" ON public.cotacoes_frete;

CREATE POLICY "Auth users can view cotacoes_frete" ON public.cotacoes_frete
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can insert cotacoes_frete" ON public.cotacoes_frete
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update cotacoes_frete" ON public.cotacoes_frete
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete cotacoes_frete" ON public.cotacoes_frete
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 9. NOTIFICACOES_CUSTO: Fix INSERT
DROP POLICY IF EXISTS "Authenticated users can insert notificacoes_custo" ON public.notificacoes_custo;

CREATE POLICY "Auth users can insert notificacoes_custo" ON public.notificacoes_custo
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- 10. ALERTAS_CUSTO: Add missing policies (was empty)
ALTER TABLE public.alertas_custo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view alertas_custo" ON public.alertas_custo
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can insert alertas_custo" ON public.alertas_custo
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update alertas_custo" ON public.alertas_custo
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete alertas_custo" ON public.alertas_custo
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 11. COTACOES_MULTICANAL: Add missing policies (has user_id)
ALTER TABLE public.cotacoes_multicanal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cotacoes_multicanal" ON public.cotacoes_multicanal
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own cotacoes_multicanal" ON public.cotacoes_multicanal
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cotacoes_multicanal" ON public.cotacoes_multicanal
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete cotacoes_multicanal" ON public.cotacoes_multicanal
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 12. WEBHOOK_DELIVERIES: Add policies via webhook ownership
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Webhook owners can view deliveries" ON public.webhook_deliveries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_webhooks w
      WHERE w.id = webhook_deliveries.webhook_id
      AND (w.created_by = auth.uid() OR has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Service can insert webhook deliveries" ON public.webhook_deliveries
  FOR INSERT TO service_role
  WITH CHECK (true);

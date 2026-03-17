
-- =====================================================
-- DEEP SECURITY HARDENING: Fix all 9 remaining findings
-- =====================================================

-- 1. CLIENTES: Restrict INSERT/UPDATE to admin (PII protection)
DROP POLICY IF EXISTS "Auth users can insert clientes" ON public.clientes;
DROP POLICY IF EXISTS "Auth users can update clientes" ON public.clientes;

CREATE POLICY "Admins can insert clientes" ON public.clientes
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update clientes" ON public.clientes
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. FORNECEDORES: Restrict INSERT/UPDATE to admin (PII protection)
DROP POLICY IF EXISTS "Auth users can insert fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Auth users can update fornecedores" ON public.fornecedores;

CREATE POLICY "Admins can insert fornecedores" ON public.fornecedores
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update fornecedores" ON public.fornecedores
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 3. TRANSPORTADORAS: Restrict INSERT/UPDATE to admin
DROP POLICY IF EXISTS "Auth users can insert transportadoras" ON public.transportadoras;
DROP POLICY IF EXISTS "Auth users can update transportadoras" ON public.transportadoras;

CREATE POLICY "Admins can insert transportadoras" ON public.transportadoras
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update transportadoras" ON public.transportadoras
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 4. TABELAS_FRETE: Restrict INSERT/UPDATE to admin (pricing data)
DROP POLICY IF EXISTS "Auth users can insert tabelas_frete" ON public.tabelas_frete;
DROP POLICY IF EXISTS "Auth users can update tabelas_frete" ON public.tabelas_frete;

CREATE POLICY "Admins can insert tabelas_frete" ON public.tabelas_frete
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update tabelas_frete" ON public.tabelas_frete
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 5. TRANSPORTADORA_ROTAS: Restrict INSERT/UPDATE to admin (pricing data)
DROP POLICY IF EXISTS "Auth users can insert transportadora_rotas" ON public.transportadora_rotas;
DROP POLICY IF EXISTS "Auth users can update transportadora_rotas" ON public.transportadora_rotas;

CREATE POLICY "Admins can insert transportadora_rotas" ON public.transportadora_rotas
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update transportadora_rotas" ON public.transportadora_rotas
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 6. ENTREGAS: Restrict UPDATE to admin
DROP POLICY IF EXISTS "Auth users can update entregas" ON public.entregas;

CREATE POLICY "Admins can update entregas" ON public.entregas
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 7. COLETAS: Restrict UPDATE to admin
DROP POLICY IF EXISTS "Auth users can update coletas" ON public.coletas;

CREATE POLICY "Admins can update coletas" ON public.coletas
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 8. COTACOES_FRETE: Restrict INSERT/UPDATE to admin
DROP POLICY IF EXISTS "Auth users can insert cotacoes_frete" ON public.cotacoes_frete;
DROP POLICY IF EXISTS "Auth users can update cotacoes_frete" ON public.cotacoes_frete;

CREATE POLICY "Admins can insert cotacoes_frete" ON public.cotacoes_frete
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update cotacoes_frete" ON public.cotacoes_frete
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 9. NOTIFICACOES_CUSTO: Restrict to admin
DROP POLICY IF EXISTS "Auth users can insert notificacoes_custo" ON public.notificacoes_custo;
DROP POLICY IF EXISTS "Authenticated users can view notificacoes_custo" ON public.notificacoes_custo;

CREATE POLICY "Admins can view notificacoes_custo" ON public.notificacoes_custo
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert notificacoes_custo" ON public.notificacoes_custo
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 10. CONCILIACAO_ITENS_IMPORTADOS: Restrict to admin
DROP POLICY IF EXISTS "Authenticated users can create conciliacao_itens_importados" ON public.conciliacao_itens_importados;
DROP POLICY IF EXISTS "Authenticated users can update conciliacao_itens_importados" ON public.conciliacao_itens_importados;
DROP POLICY IF EXISTS "Authenticated users can delete conciliacao_itens_importados" ON public.conciliacao_itens_importados;
DROP POLICY IF EXISTS "Authenticated users can view conciliacao_itens_importados" ON public.conciliacao_itens_importados;

CREATE POLICY "Admins can view conciliacao_itens" ON public.conciliacao_itens_importados
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert conciliacao_itens" ON public.conciliacao_itens_importados
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update conciliacao_itens" ON public.conciliacao_itens_importados
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete conciliacao_itens" ON public.conciliacao_itens_importados
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 11. CONCILIACOES: Restrict to admin/creator
DROP POLICY IF EXISTS "Authenticated users can view conciliacoes" ON public.conciliacoes;
DROP POLICY IF EXISTS "Authenticated users can insert conciliacoes" ON public.conciliacoes;
DROP POLICY IF EXISTS "Authenticated users can update conciliacoes" ON public.conciliacoes;

CREATE POLICY "Admin or creator can view conciliacoes" ON public.conciliacoes
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert conciliacoes" ON public.conciliacoes
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update conciliacoes" ON public.conciliacoes
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 12. ALERTAS_CUSTO: Restrict to admin
DROP POLICY IF EXISTS "Auth users can view alertas_custo" ON public.alertas_custo;
DROP POLICY IF EXISTS "Auth users can insert alertas_custo" ON public.alertas_custo;
DROP POLICY IF EXISTS "Auth users can update alertas_custo" ON public.alertas_custo;

CREATE POLICY "Admins can view alertas_custo" ON public.alertas_custo
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert alertas_custo" ON public.alertas_custo
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update alertas_custo" ON public.alertas_custo
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 13. FRETES_INTERNOS & OCORRENCIAS: Tighten UPDATE to admin
DROP POLICY IF EXISTS "Authenticated users can update fretes_internos" ON public.fretes_internos;
CREATE POLICY "Admins can update fretes_internos" ON public.fretes_internos
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can update ocorrencias" ON public.ocorrencias;
CREATE POLICY "Admins can update ocorrencias" ON public.ocorrencias
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

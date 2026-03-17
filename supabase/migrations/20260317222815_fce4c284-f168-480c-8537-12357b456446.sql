
-- Fix remaining security findings

-- 1. rastreamento_historico: restrict to admin role
DROP POLICY IF EXISTS "Authenticated users can view tracking history" ON public.rastreamento_historico;
DROP POLICY IF EXISTS "Authenticated users can insert tracking data" ON public.rastreamento_historico;

CREATE POLICY "Admins can view tracking history" ON public.rastreamento_historico
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service inserts tracking data" ON public.rastreamento_historico
  FOR INSERT TO service_role
  WITH CHECK (true);

-- 2. notificacoes_custo: remove old permissive UPDATE/DELETE policies
DROP POLICY IF EXISTS "Authenticated users can update notificacoes_custo" ON public.notificacoes_custo;
DROP POLICY IF EXISTS "Authenticated users can delete notificacoes_custo" ON public.notificacoes_custo;

-- 3. client_webhooks: add proper ownership-based policies back
CREATE POLICY "Webhook owners can view" ON public.client_webhooks
  FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Webhook owners can insert" ON public.client_webhooks
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Webhook owners can update" ON public.client_webhooks
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Webhook admin can delete" ON public.client_webhooks
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 4. Tighten core table UPDATE policies to require auth.uid() IS NOT NULL (already done)
-- The remaining WARN about UPDATE with auth.uid() IS NOT NULL is acceptable for
-- operational tables where all authenticated team members need write access.
-- These are internal business tables, not user-owned personal data.

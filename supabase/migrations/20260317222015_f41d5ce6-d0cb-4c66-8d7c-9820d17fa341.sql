
-- Fix: drop already-created policies before re-creating

-- conciliacoes already had some created, skip those
DROP POLICY IF EXISTS "Authenticated users can view conciliacoes" ON public.conciliacoes;
DROP POLICY IF EXISTS "Authenticated users can insert conciliacoes" ON public.conciliacoes;
DROP POLICY IF EXISTS "Authenticated users can update conciliacoes" ON public.conciliacoes;
DROP POLICY IF EXISTS "Admins can delete conciliacoes" ON public.conciliacoes;

CREATE POLICY "Auth view conciliacoes" ON public.conciliacoes
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth insert conciliacoes" ON public.conciliacoes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Auth update conciliacoes" ON public.conciliacoes
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin delete conciliacoes" ON public.conciliacoes
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- notificacoes_custo
DROP POLICY IF EXISTS "Authenticated users can manage notificacoes_custo" ON public.notificacoes_custo;
DROP POLICY IF EXISTS "Authenticated users can view notificacoes_custo" ON public.notificacoes_custo;
DROP POLICY IF EXISTS "System inserts notificacoes_custo" ON public.notificacoes_custo;
DROP POLICY IF EXISTS "Auth users can update notificacoes_custo" ON public.notificacoes_custo;

CREATE POLICY "View notificacoes_custo" ON public.notificacoes_custo
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Insert notificacoes_custo" ON public.notificacoes_custo
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Update notificacoes_custo" ON public.notificacoes_custo
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- fretes_internos
DROP POLICY IF EXISTS "Authenticated users can manage fretes_internos" ON public.fretes_internos;
DROP POLICY IF EXISTS "Authenticated users can view fretes_internos" ON public.fretes_internos;
DROP POLICY IF EXISTS "Authenticated users can insert fretes_internos" ON public.fretes_internos;
DROP POLICY IF EXISTS "Authenticated users can update fretes_internos" ON public.fretes_internos;
DROP POLICY IF EXISTS "Admins can delete fretes_internos" ON public.fretes_internos;

CREATE POLICY "View fretes_internos" ON public.fretes_internos
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Insert fretes_internos" ON public.fretes_internos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Update fretes_internos" ON public.fretes_internos
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin delete fretes_internos" ON public.fretes_internos
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ocorrencias
DROP POLICY IF EXISTS "Authenticated users can manage ocorrencias" ON public.ocorrencias;
DROP POLICY IF EXISTS "Authenticated users can view ocorrencias" ON public.ocorrencias;
DROP POLICY IF EXISTS "Authenticated users can insert ocorrencias" ON public.ocorrencias;
DROP POLICY IF EXISTS "Authenticated users can update ocorrencias" ON public.ocorrencias;
DROP POLICY IF EXISTS "Admins can delete ocorrencias" ON public.ocorrencias;

CREATE POLICY "View ocorrencias" ON public.ocorrencias
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Insert ocorrencias" ON public.ocorrencias
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Update ocorrencias" ON public.ocorrencias
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin delete ocorrencias" ON public.ocorrencias
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- allowed_ips
DROP POLICY IF EXISTS "Users can manage their own allowed IPs" ON public.allowed_ips;
DROP POLICY IF EXISTS "Users can insert own IPs" ON public.allowed_ips;
DROP POLICY IF EXISTS "Users can update own IPs" ON public.allowed_ips;
DROP POLICY IF EXISTS "Users can delete own IPs" ON public.allowed_ips;

CREATE POLICY "Insert own IPs" ON public.allowed_ips
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Update own IPs" ON public.allowed_ips
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
  WITH CHECK (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Delete own IPs" ON public.allowed_ips
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

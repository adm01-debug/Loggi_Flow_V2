
-- Fix conflicting permissive policies and remaining findings

-- 1. CONCILIACOES: Remove broad policies that override admin-only ones
DROP POLICY IF EXISTS "Auth view conciliacoes" ON public.conciliacoes;
DROP POLICY IF EXISTS "Auth insert conciliacoes" ON public.conciliacoes;
DROP POLICY IF EXISTS "Auth update conciliacoes" ON public.conciliacoes;

-- 2. NOTIFICACOES_CUSTO: Remove broad policies that override admin-only ones
DROP POLICY IF EXISTS "View notificacoes_custo" ON public.notificacoes_custo;
DROP POLICY IF EXISTS "Insert notificacoes_custo" ON public.notificacoes_custo;
DROP POLICY IF EXISTS "Update notificacoes_custo" ON public.notificacoes_custo;

-- 3. ROLE_PERMISSIONS: Restrict to authenticated only
DROP POLICY IF EXISTS "Anyone can view role permissions" ON public.role_permissions;
CREATE POLICY "Auth users can view role permissions" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 4. PASSWORD_RESET_REQUESTS: Enforce status=pending on insert
DROP POLICY IF EXISTS "Anyone can create password reset requests" ON public.password_reset_requests;
CREATE POLICY "Public can create pending reset requests" ON public.password_reset_requests
  FOR INSERT TO public
  WITH CHECK (email IS NOT NULL AND length(email) > 0 AND status = 'pending' AND reviewed_at IS NULL AND reviewed_by IS NULL);

-- 5. GEO_BLOCKING_RULES: Restrict SELECT to admin
DROP POLICY IF EXISTS "Authenticated users can view geo rules" ON public.geo_blocking_rules;
CREATE POLICY "Admins can view geo rules" ON public.geo_blocking_rules
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 6. GEO_BLOCKING_SETTINGS: Restrict SELECT to admin
DROP POLICY IF EXISTS "Authenticated users can view geo settings" ON public.geo_blocking_settings;
CREATE POLICY "Admins can view geo settings" ON public.geo_blocking_settings
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Security hardening for RLS policies and public tracking access

-- 1) account_lockouts: remove public ALL access
DROP POLICY IF EXISTS "System can manage lockouts" ON public.account_lockouts;
CREATE POLICY "System can manage lockouts"
ON public.account_lockouts
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2) email_verification_tokens: remove public ALL access
DROP POLICY IF EXISTS "System can manage verification tokens" ON public.email_verification_tokens;
CREATE POLICY "System can manage verification tokens"
ON public.email_verification_tokens
AS PERMISSIVE
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3) notificacoes_custo: remove anonymous unrestricted access
DROP POLICY IF EXISTS "Allow all access to notificacoes_custo" ON public.notificacoes_custo;

CREATE POLICY "Authenticated users can view notificacoes_custo"
ON public.notificacoes_custo
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert notificacoes_custo"
ON public.notificacoes_custo
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update notificacoes_custo"
ON public.notificacoes_custo
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete notificacoes_custo"
ON public.notificacoes_custo
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (true);

-- 4) user_sessions: remove public ALL access and enforce ownership/admin visibility
DROP POLICY IF EXISTS "System can manage sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.user_sessions;

CREATE POLICY "Users can view their own sessions"
ON public.user_sessions
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
ON public.user_sessions
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert their own sessions"
ON public.user_sessions
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.user_sessions
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.user_sessions
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 5) notifications: prevent anonymous notification injection
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can create their own notifications"
ON public.notifications
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications
AS PERMISSIVE
FOR INSERT
TO service_role
WITH CHECK (true);

-- 6) audit_logs: prevent anonymous audit log injection
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
AS PERMISSIVE
FOR INSERT
TO service_role
WITH CHECK (true);

-- 7) security_events: prevent anonymous insertion while preserving app logging
DROP POLICY IF EXISTS "System can insert security events" ON public.security_events;

CREATE POLICY "Users can insert their own security events"
ON public.security_events
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

CREATE POLICY "System can insert security events"
ON public.security_events
AS PERMISSIVE
FOR INSERT
TO service_role
WITH CHECK (true);

-- 8) login_attempts: prevent anonymous fabrication
DROP POLICY IF EXISTS "System can insert login attempts" ON public.login_attempts;
CREATE POLICY "System can insert login attempts"
ON public.login_attempts
AS PERMISSIVE
FOR INSERT
TO service_role
WITH CHECK (true);

-- 9) Public tracking hardening: remove broad anonymous SELECT on full entregas rows
DROP POLICY IF EXISTS "Public can view entregas for tracking" ON public.entregas;

-- 10) Expose only minimal tracking fields via SECURITY DEFINER function
CREATE OR REPLACE FUNCTION public.get_public_tracking(p_code text)
RETURNS TABLE (
  numero_entrega text,
  status public.entrega_status,
  codigo_rastreamento text,
  nf_remessa text,
  previsao_entrega timestamp with time zone,
  data_despacho timestamp with time zone,
  data_entrega_efetiva timestamp with time zone,
  recebedor text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    e.numero_entrega,
    e.status,
    e.codigo_rastreamento,
    e.nf_remessa,
    e.previsao_entrega,
    e.data_despacho,
    e.data_entrega_efetiva,
    e.recebedor,
    e.created_at,
    e.updated_at
  FROM public.entregas e
  WHERE e.codigo_rastreamento = p_code OR e.nf_remessa = p_code
  ORDER BY e.updated_at DESC NULLS LAST, e.created_at DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_tracking(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_tracking(text) TO anon, authenticated;
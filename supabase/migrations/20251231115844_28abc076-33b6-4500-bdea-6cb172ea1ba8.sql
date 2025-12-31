-- =============================================
-- MÓDULO DE SEGURANÇA AVANÇADA
-- =============================================

-- 1. Tabela de Rate Limit Logs
CREATE TABLE IF NOT EXISTS public.rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  blocked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_rate_limit_logs_ip ON public.rate_limit_logs(ip_address);
CREATE INDEX idx_rate_limit_logs_created_at ON public.rate_limit_logs(created_at);
CREATE INDEX idx_rate_limit_logs_blocked ON public.rate_limit_logs(blocked);

-- RLS para rate_limit_logs
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view rate limit logs"
ON public.rate_limit_logs FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert rate limit logs"
ON public.rate_limit_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can delete rate limit logs"
ON public.rate_limit_logs FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Tabela de Sessões de Usuário (Device Management)
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  location TEXT,
  is_current BOOLEAN DEFAULT false,
  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_last_active ON public.user_sessions(last_active_at);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
ON public.user_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.user_sessions FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "System can manage sessions"
ON public.user_sessions FOR ALL
WITH CHECK (true);

-- 3. Tabela de Permissões Granulares
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view permissions"
ON public.permissions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage permissions"
ON public.permissions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Tabela de Role-Permissions (Matriz)
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view role permissions"
ON public.role_permissions FOR SELECT
USING (true);

CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Tabela de Email Verification Tokens
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_verification_token ON public.email_verification_tokens(token);

ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage verification tokens"
ON public.email_verification_tokens FOR ALL
WITH CHECK (true);

-- 6. Tabela de Security Events (Audit avançado)
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  description TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_security_events_user ON public.security_events(user_id);
CREATE INDEX idx_security_events_type ON public.security_events(event_type);
CREATE INDEX idx_security_events_severity ON public.security_events(severity);
CREATE INDEX idx_security_events_created ON public.security_events(created_at);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security events"
ON public.security_events FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert security events"
ON public.security_events FOR INSERT
WITH CHECK (true);

-- 7. Tabela de Account Lockouts
CREATE TABLE IF NOT EXISTS public.account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  locked_until TIMESTAMP WITH TIME ZONE NOT NULL,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_account_lockouts_email ON public.account_lockouts(email);

ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view lockouts"
ON public.account_lockouts FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can manage lockouts"
ON public.account_lockouts FOR ALL
WITH CHECK (true);

-- 8. Inserir permissões padrão
INSERT INTO public.permissions (code, name, description, module) VALUES
-- Dashboard
('dashboard.view', 'Visualizar Dashboard', 'Acesso ao dashboard principal', 'dashboard'),
('dashboard.widgets.manage', 'Gerenciar Widgets', 'Adicionar/remover widgets do dashboard', 'dashboard'),

-- Coletas
('coletas.view', 'Visualizar Coletas', 'Ver lista de coletas', 'coletas'),
('coletas.create', 'Criar Coletas', 'Criar novas coletas', 'coletas'),
('coletas.edit', 'Editar Coletas', 'Editar coletas existentes', 'coletas'),
('coletas.delete', 'Excluir Coletas', 'Excluir coletas', 'coletas'),

-- Entregas
('entregas.view', 'Visualizar Entregas', 'Ver lista de entregas', 'entregas'),
('entregas.create', 'Criar Entregas', 'Criar novas entregas', 'entregas'),
('entregas.edit', 'Editar Entregas', 'Editar entregas existentes', 'entregas'),
('entregas.delete', 'Excluir Entregas', 'Excluir entregas', 'entregas'),

-- Usuários
('users.view', 'Visualizar Usuários', 'Ver lista de usuários', 'users'),
('users.manage', 'Gerenciar Usuários', 'Criar/editar/excluir usuários', 'users'),
('users.roles', 'Gerenciar Roles', 'Atribuir roles a usuários', 'users'),

-- Segurança
('security.view', 'Visualizar Segurança', 'Acesso à central de segurança', 'security'),
('security.mfa', 'Gerenciar MFA', 'Configurar autenticação 2FA', 'security'),
('security.ip', 'Controle de IP', 'Gerenciar whitelist/blacklist de IPs', 'security'),
('security.logs', 'Ver Logs de Segurança', 'Visualizar logs de login e auditoria', 'security'),
('security.rate_limit', 'Rate Limiting', 'Gerenciar configurações de rate limit', 'security'),

-- Relatórios
('reports.view', 'Visualizar Relatórios', 'Acesso a relatórios', 'reports'),
('reports.export', 'Exportar Relatórios', 'Exportar dados em CSV/PDF', 'reports'),
('reports.schedule', 'Agendar Relatórios', 'Configurar relatórios agendados', 'reports'),

-- Configurações
('settings.view', 'Visualizar Configurações', 'Acesso às configurações', 'settings'),
('settings.edit', 'Editar Configurações', 'Modificar configurações do sistema', 'settings'),

-- Analytics
('analytics.view', 'Visualizar Analytics', 'Acesso ao módulo de analytics', 'analytics'),
('analytics.advanced', 'Analytics Avançado', 'Acesso a métricas avançadas', 'analytics')

ON CONFLICT (code) DO NOTHING;

-- 9. Atribuir todas as permissões ao admin
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'admin'::app_role, id FROM public.permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- 10. Atribuir permissões básicas ao user
INSERT INTO public.role_permissions (role, permission_id)
SELECT 'user'::app_role, id FROM public.permissions 
WHERE code IN (
  'dashboard.view',
  'coletas.view',
  'entregas.view',
  'reports.view',
  'analytics.view'
)
ON CONFLICT (role, permission_id) DO NOTHING;

-- 11. Função para verificar permissão
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = _user_id
      AND p.code = _permission_code
  )
$$;

-- 12. Função para obter todas as permissões do usuário
CREATE OR REPLACE FUNCTION public.get_user_permissions(_user_id uuid)
RETURNS TABLE(permission_code text, permission_name text, module text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.code, p.name, p.module
  FROM public.user_roles ur
  JOIN public.role_permissions rp ON rp.role = ur.role
  JOIN public.permissions p ON p.id = rp.permission_id
  WHERE ur.user_id = _user_id
  ORDER BY p.module, p.code
$$;

-- 13. Enable realtime for security tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rate_limit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_events;
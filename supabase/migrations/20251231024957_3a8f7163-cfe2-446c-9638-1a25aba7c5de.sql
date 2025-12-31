-- Create allowed IPs table for IP-based access control
CREATE TABLE public.allowed_ips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.allowed_ips ENABLE ROW LEVEL SECURITY;

-- Users can view their own allowed IPs
CREATE POLICY "Users can view their own allowed IPs"
ON public.allowed_ips
FOR SELECT
USING (auth.uid() = user_id);

-- Users can manage their own allowed IPs
CREATE POLICY "Users can manage their own allowed IPs"
ON public.allowed_ips
FOR ALL
USING (auth.uid() = user_id);

-- Admins can manage all allowed IPs
CREATE POLICY "Admins can manage all allowed IPs"
ON public.allowed_ips
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create global IP whitelist/blacklist table (admin only)
CREATE TABLE public.ip_access_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_pattern TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('whitelist', 'blacklist')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ip_access_rules ENABLE ROW LEVEL SECURITY;

-- Only admins can view IP rules
CREATE POLICY "Admins can view IP rules"
ON public.ip_access_rules
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can manage IP rules
CREATE POLICY "Admins can manage IP rules"
ON public.ip_access_rules
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create login attempts table for security tracking
CREATE TABLE public.login_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view login attempts
CREATE POLICY "Admins can view login attempts"
ON public.login_attempts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert login attempts
CREATE POLICY "System can insert login attempts"
ON public.login_attempts
FOR INSERT
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_allowed_ips_user ON public.allowed_ips(user_id);
CREATE INDEX idx_ip_access_rules_type ON public.ip_access_rules(rule_type);
CREATE INDEX idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX idx_login_attempts_ip ON public.login_attempts(ip_address);
CREATE INDEX idx_login_attempts_created ON public.login_attempts(created_at DESC);
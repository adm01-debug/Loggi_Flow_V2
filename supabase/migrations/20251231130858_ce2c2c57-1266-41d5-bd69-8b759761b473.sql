-- Create table for geographic access rules (country whitelist)
CREATE TABLE public.geo_access_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code VARCHAR(2) NOT NULL,
  country_name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(country_code)
);

-- Enable RLS
ALTER TABLE public.geo_access_rules ENABLE ROW LEVEL SECURITY;

-- Only admins can manage geo rules
CREATE POLICY "Admins can manage geo access rules"
ON public.geo_access_rules
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create table to track blocked geo access attempts
CREATE TABLE public.geo_blocked_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL,
  country_code VARCHAR(2),
  country_name VARCHAR(100),
  email VARCHAR(255),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.geo_blocked_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view blocked attempts
CREATE POLICY "Admins can view geo blocked attempts"
ON public.geo_blocked_attempts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add some common countries by default (Brazil as initial whitelist)
INSERT INTO public.geo_access_rules (country_code, country_name, is_active)
VALUES ('BR', 'Brasil', true)
ON CONFLICT (country_code) DO NOTHING;

-- Add index for performance
CREATE INDEX idx_geo_access_rules_active ON public.geo_access_rules(is_active) WHERE is_active = true;
CREATE INDEX idx_geo_blocked_attempts_created ON public.geo_blocked_attempts(created_at DESC);
-- Create feature flags table
CREATE TABLE public.feature_flags (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Profiles can read feature flags
CREATE POLICY "Everyone can view feature flags" 
ON public.feature_flags 
FOR SELECT 
USING (true);

-- Only admins can modify feature flags
CREATE POLICY "Only admins can modify feature flags" 
ON public.feature_flags 
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_feature_flags_updated_at
BEFORE UPDATE ON public.feature_flags
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default flags
INSERT INTO public.feature_flags (key, description, is_enabled) VALUES 
('ai-assistant-v2', 'Habilita a nova versão do assistente logístico com Gemini 1.5 Pro', true),
('carrier-negotiation-ai', 'Habilita o assistente de negociação com transportadoras', false),
('realtime-tracking-lalamove', 'Ativa o rastreamento em tempo real via Mapbox para Lalamove', true);
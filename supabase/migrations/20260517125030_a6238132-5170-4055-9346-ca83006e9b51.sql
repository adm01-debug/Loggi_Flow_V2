-- Add admin/config fields to transportadoras
ALTER TABLE public.transportadoras 
ADD COLUMN IF NOT EXISTS credentials JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS coverage_details JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS non_api_config JSONB DEFAULT '{}'::jsonb;

-- Add tracking/audit fields to cotacoes_multicanal
ALTER TABLE public.cotacoes_multicanal
ADD COLUMN IF NOT EXISTS workflow_logs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS normalization_data JSONB DEFAULT '{}'::jsonb;

-- Create table for freight selection rules
CREATE TABLE IF NOT EXISTS public.freight_selection_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    max_sla_days INTEGER,
    price_weight NUMERIC DEFAULT 0.5,
    time_weight NUMERIC DEFAULT 0.5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.freight_selection_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to selection rules" ON public.freight_selection_rules FOR ALL USING (true);

-- Create table for incoming webhooks/mappings
CREATE TABLE IF NOT EXISTS public.freight_integration_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transportadora_id UUID REFERENCES public.transportadoras(id),
    source_type TEXT NOT NULL, -- 'webhook', 'email_parse', 'whatsapp_parse'
    mapping_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.freight_integration_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to integration mappings" ON public.freight_integration_mappings FOR ALL USING (true);

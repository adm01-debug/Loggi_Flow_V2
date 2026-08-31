-- Create freight_selection_rules table
CREATE TABLE IF NOT EXISTS public.freight_selection_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    price_weight INTEGER DEFAULT 50,
    time_weight INTEGER DEFAULT 50,
    max_sla_days INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create freight_integration_mappings table
CREATE TABLE IF NOT EXISTS public.freight_integration_mappings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transportadora_id UUID REFERENCES public.transportadoras(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL, -- 'webhook', 'api', 'file'
    config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.freight_selection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.freight_integration_mappings ENABLE ROW LEVEL SECURITY;

-- Policies for rules
CREATE POLICY "Allow read for rules" ON public.freight_selection_rules FOR SELECT USING (true);
CREATE POLICY "Allow all for authenticated on rules" ON public.freight_selection_rules FOR ALL USING (auth.role() = 'authenticated');

-- Policies for mappings
CREATE POLICY "Allow read for mappings" ON public.freight_integration_mappings FOR SELECT USING (true);
CREATE POLICY "Allow all for authenticated on mappings" ON public.freight_integration_mappings FOR ALL USING (auth.role() = 'authenticated');

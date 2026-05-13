CREATE TABLE IF NOT EXISTS public.business_rules_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.business_rules_config ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Business rules are viewable by all authenticated users"
    ON public.business_rules_config FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Business rules can only be managed by admins"
    ON public.business_rules_config FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger for updated_at
CREATE TRIGGER update_business_rules_updated_at
    BEFORE UPDATE ON public.business_rules_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Initial Seed for Business Rules
INSERT INTO public.business_rules_config (key, value, description)
VALUES 
    ('SLA_PENDING_HOURS', '"24"', 'Horas máximas para uma entrega sair do status pendente'),
    ('OTIF_THRESHOLD_PERCENT', '"95"', 'Meta mínima de OTIF (%)'),
    ('FREIGHT_AUDIT_TOLERANCE', '"0.01"', 'Tolerância para divergência de frete (R$)')
ON CONFLICT (key) DO NOTHING;

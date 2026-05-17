-- Tabela para gerenciar Webhooks de transportadoras
CREATE TABLE IF NOT EXISTS public.freight_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transportadora_id UUID REFERENCES public.transportadoras(id) ON DELETE CASCADE,
    endpoint_url TEXT NOT NULL,
    secret_key TEXT,
    event_type TEXT NOT NULL, -- quote_response, delivery_update, etc
    is_active BOOLEAN DEFAULT true,
    last_called_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Auditoria de Automação em Tempo Real
CREATE TABLE IF NOT EXISTS public.automation_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID,
    entity_id UUID,
    entity_type TEXT,
    action_taken TEXT,
    payload JSONB,
    status TEXT, -- success, failure
    error_message TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index para performance de busca de rotas
CREATE INDEX IF NOT EXISTS idx_transportadora_rotas_cep_range 
ON public.transportadora_rotas (origem_cep_inicio, origem_cep_fim, destino_cep_inicio, destino_cep_fim);

-- RLS Policies
ALTER TABLE public.freight_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for authenticated users on webhooks" ON public.freight_webhooks FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all for authenticated users on audit logs" ON public.automation_audit_logs FOR ALL USING (auth.role() = 'authenticated');

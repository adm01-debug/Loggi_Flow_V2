-- Tabela para logs de auto-healing
CREATE TABLE IF NOT EXISTS public.system_integrity_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    action_type TEXT NOT NULL, -- 'data_repair', 'cache_clear', 'service_restart'
    description TEXT NOT NULL,
    entity_affected TEXT, -- 'entregas', 'coletas', 'auth'
    severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de heartbeat de serviços
CREATE TABLE IF NOT EXISTS public.system_heartbeat (
    service_name TEXT PRIMARY KEY,
    status TEXT NOT NULL, -- 'operational', 'degraded', 'down'
    latency_ms INTEGER,
    last_check TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    version TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Habilitar RLS
ALTER TABLE public.system_integrity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_heartbeat ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Admins can manage system logs" 
ON public.system_integrity_logs FOR ALL 
USING (auth.uid() IN (SELECT id FROM profiles WHERE cargo = 'admin' OR cargo = 'gestor'));

CREATE POLICY "All users can view heartbeat" 
ON public.system_heartbeat FOR SELECT 
USING (true);

-- Dados iniciais de heartbeat
INSERT INTO public.system_heartbeat (service_name, status, version)
VALUES 
    ('database', 'operational', 'nexus-db-v10'),
    ('edge_functions', 'operational', 'nexus-functions-v10'),
    ('storage', 'operational', 'nexus-storage-v10'),
    ('auth', 'operational', 'nexus-auth-v10')
ON CONFLICT (service_name) DO UPDATE SET last_check = now();

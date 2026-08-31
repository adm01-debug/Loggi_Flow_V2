-- 1. Idempotency table for external webhooks
CREATE TABLE IF NOT EXISTS public.webhook_events_processed (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    external_event_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB,
    CONSTRAINT unique_external_event_per_provider UNIQUE (external_event_id, provider)
);

-- Enable RLS
ALTER TABLE public.webhook_events_processed ENABLE ROW LEVEL SECURITY;

-- Policies for idempotency table
CREATE POLICY "System can manage webhook events" ON public.webhook_events_processed FOR ALL USING (true) WITH CHECK (true);

-- 2. Audit Logs Policies (Ensuring they are applied to partitions)
DO $$
DECLARE
    partition_name TEXT;
    m INTEGER;
BEGIN
    FOR m IN 1..12 LOOP
        partition_name := 'audit_logs_y2026m' || LPAD(m::text, 2, '0');
        
        -- Select Policy
        EXECUTE format('DROP POLICY IF EXISTS "Admin can view all audit logs" ON public.%I', partition_name);
        EXECUTE format('CREATE POLICY "Admin can view all audit logs" ON public.%I FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = ''admin''))', partition_name);
        
        EXECUTE format('DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.%I', partition_name);
        EXECUTE format('CREATE POLICY "Users can view their own audit logs" ON public.%I FOR SELECT USING (user_id = auth.uid())', partition_name);
        
        -- Insert Policy
        EXECUTE format('DROP POLICY IF EXISTS "System can insert audit logs" ON public.%I', partition_name);
        EXECUTE format('CREATE POLICY "System can insert audit logs" ON public.%I FOR INSERT WITH CHECK (true)', partition_name);
    END LOOP;
END $$;

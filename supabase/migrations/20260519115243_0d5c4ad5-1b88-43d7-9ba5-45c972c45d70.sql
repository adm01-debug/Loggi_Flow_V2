-- Performance Metrics for Carriers and Drivers
CREATE TABLE public.performance_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_id UUID NOT NULL, -- carrier_id or driver_id
    entity_type TEXT NOT NULL CHECK (entity_type IN ('carrier', 'driver')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_freights INTEGER DEFAULT 0,
    on_time_deliveries INTEGER DEFAULT 0,
    late_deliveries INTEGER DEFAULT 0,
    sla_compliance_rate NUMERIC(5,2),
    average_lead_time_hours NUMERIC(10,2),
    efficiency_score NUMERIC(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bitrix24 Sync Configuration
CREATE TABLE public.bitrix_sync_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_url TEXT,
    client_id TEXT,
    client_secret TEXT,
    access_token TEXT,
    refresh_token TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    sync_interval_minutes INTEGER DEFAULT 60,
    field_mapping JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bitrix24 Sync Logs
CREATE TABLE public.bitrix_sync_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    config_id UUID REFERENCES public.bitrix_sync_config(id),
    status TEXT NOT NULL,
    synced_items_count INTEGER DEFAULT 0,
    error_message TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notification Templates
CREATE TABLE public.notification_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    subject TEXT,
    body_text TEXT NOT NULL,
    body_html TEXT,
    channels TEXT[] DEFAULT '{"email", "whatsapp"}', -- email, whatsapp, in_app
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- SLA Violations / Alerts
CREATE TABLE public.sla_alerts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    freight_id UUID NOT NULL,
    alert_type TEXT NOT NULL, -- near_deadline, violated, status_stuck
    severity TEXT DEFAULT 'warning', -- info, warning, critical
    message TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitrix_sync_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bitrix_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_alerts ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for admin/authenticated users)
CREATE POLICY "Full access to performance_metrics for authenticated" ON public.performance_metrics FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access to bitrix_sync_config for authenticated" ON public.bitrix_sync_config FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access to bitrix_sync_logs for authenticated" ON public.bitrix_sync_logs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access to notification_templates for authenticated" ON public.notification_templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Full access to sla_alerts for authenticated" ON public.sla_alerts FOR ALL USING (auth.role() = 'authenticated');

-- Function to update performance metrics
CREATE OR REPLACE FUNCTION public.update_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Logic to calculate and update/insert performance metrics based on freight status changes
  -- This would typically be called after a freight is marked as 'delivered'
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

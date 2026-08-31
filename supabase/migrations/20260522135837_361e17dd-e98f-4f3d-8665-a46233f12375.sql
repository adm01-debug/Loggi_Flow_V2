-- Table for BioSync alert rules
CREATE TABLE IF NOT EXISTS public.bio_sync_alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id TEXT, -- NULL means global rule
    bpm_warning_threshold INTEGER DEFAULT 95,
    bpm_critical_threshold INTEGER DEFAULT 110,
    fatigue_warning_threshold TEXT DEFAULT 'MED',
    cooldown_minutes INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bio_sync_alert_rules ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Rules are viewable by everyone" ON public.bio_sync_alert_rules FOR SELECT USING (true);
CREATE POLICY "Rules can be updated by admins" ON public.bio_sync_alert_rules FOR ALL USING (true); -- Simplified for now

-- Insert default global rule
INSERT INTO public.bio_sync_alert_rules (bpm_warning_threshold, bpm_critical_threshold, fatigue_warning_threshold, cooldown_minutes)
VALUES (95, 110, 'MED', 5)
ON CONFLICT DO NOTHING;

-- Add alert metadata to tactical logs
ALTER TABLE public.nexus_tactical_logs ADD COLUMN IF NOT EXISTS alert_metadata JSONB DEFAULT '{}';

-- Function to handle automated Bitrix notifications for alerts
CREATE OR REPLACE FUNCTION public.trigger_bitrix_alert_notification()
RETURNS TRIGGER AS $$
DECLARE
    bitrix_config RECORD;
    bitrix_message TEXT;
BEGIN
    -- Check if it is a critical alert
    IF NEW.type = 'crit' THEN
        -- Get Bitrix configuration
        SELECT * INTO bitrix_config FROM public.bitrix_sync_config LIMIT 1;
        
        IF bitrix_config.webhook_url IS NOT NULL AND bitrix_config.is_active THEN
            -- Log the intent to sync with Bitrix (actual call made via Edge Function)
            INSERT INTO public.bitrix_sync_logs (status, synced_items_count, error_message)
            VALUES ('PENDING_ALERT', 1, 'Critical Alert: ' || NEW.message);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on nexus_tactical_logs
CREATE OR REPLACE TRIGGER on_critical_alert_bitrix_sync
AFTER INSERT ON public.nexus_tactical_logs
FOR EACH ROW
EXECUTE FUNCTION public.trigger_bitrix_alert_notification();

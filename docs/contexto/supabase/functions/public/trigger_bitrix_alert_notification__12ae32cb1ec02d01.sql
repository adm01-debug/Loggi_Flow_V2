CREATE OR REPLACE FUNCTION public.trigger_bitrix_alert_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
$function$

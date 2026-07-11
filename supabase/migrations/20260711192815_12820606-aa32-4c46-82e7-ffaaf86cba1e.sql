
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['bio_sync_alert_rules','bitrix_sync_config','freight_selection_rules','freight_webhooks','notification_templates','performance_metrics','system_contract_schemas']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_updated_at ON public.%1$I; CREATE TRIGGER trg_%1$s_updated_at BEFORE UPDATE ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();', t);
  END LOOP;
END $$;

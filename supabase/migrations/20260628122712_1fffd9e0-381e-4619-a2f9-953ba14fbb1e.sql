
ALTER FUNCTION public.cleanup_old_telemetry_logs() SET search_path = public;
ALTER FUNCTION public.cleanup_old_telemetry_logs(integer) SET search_path = public;
ALTER FUNCTION public.execute_nexus_protocol(text, text) SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.jsonb_recursive_merge(jsonb, jsonb) SET search_path = public;
ALTER FUNCTION public.log_biometric_anomaly() SET search_path = public;
ALTER FUNCTION public.reconcile_pending_freights() SET search_path = public;
ALTER FUNCTION public.trigger_bitrix_alert_notification() SET search_path = public;
ALTER FUNCTION public.update_performance_metrics() SET search_path = public;
ALTER FUNCTION public.validate_payload_schema(text, jsonb) SET search_path = public;

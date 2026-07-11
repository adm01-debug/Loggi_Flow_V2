
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

REVOKE EXECUTE ON FUNCTION public.audit_log_trigger() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_audit_trigger() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_trigger_func() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_levels() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_rank() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_carrier_ranking() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_biometric_anomaly() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_device_last_seen() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_coleta_numero() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_entrega_numero() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_coleta_atrasada() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_entrega_atrasada() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_entrega_concluida() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_ocorrencia_registrada() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_conquista_desbloqueada() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_frete_interno_concluido() FROM PUBLIC, anon, authenticated;

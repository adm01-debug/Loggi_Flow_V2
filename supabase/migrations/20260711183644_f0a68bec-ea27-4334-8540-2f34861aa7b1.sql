
-- Sprint 10: Revoke EXECUTE on internal/trigger/admin SECURITY DEFINER functions from anon and authenticated.
-- Keep service_role (for admin/edge functions) and PostgREST-callable RPCs open only where needed.

-- Trigger-only functions (invoked internally by Postgres, never via API)
REVOKE ALL ON FUNCTION public.update_user_rank() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_levels() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_log_trigger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tr_increment_version() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_optimistic_locking() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_performance_metrics() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_audit_trigger() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_device_last_seen() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_entrega_numero() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_coleta_numero() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_coleta_atrasada() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_entrega_atrasada() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_conquista_desbloqueada() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_ocorrencia_registrada() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_entrega_concluida() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_frete_interno_concluido() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_frete_values() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trigger_bitrix_alert_notification() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_carrier_ranking() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_version_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_biometric_anomaly() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_version() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.audit_trigger_func() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Admin / maintenance functions (only backend/cron/edge should call)
REVOKE ALL ON FUNCTION public.cleanup_old_telemetry_logs(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_old_telemetry_logs() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_old_notifications(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.drop_old_partitions(text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_heartbeat() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reconcile_pending_freights() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.alert_slow_queries(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.system_health_check() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.add_user_xp(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_user_streak(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_payload_schema(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.execute_nexus_protocol(text, text) FROM PUBLIC, anon, authenticated;

-- Ensure service_role retains full access (needed by edge functions / cron)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Keep the public tracking RPC callable by anon (unauthenticated portal)
GRANT EXECUTE ON FUNCTION public.get_public_tracking(text) TO anon, authenticated;

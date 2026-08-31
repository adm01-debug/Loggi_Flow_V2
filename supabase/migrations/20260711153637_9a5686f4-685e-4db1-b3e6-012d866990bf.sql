
-- P12: revoke EXECUTE from anon/authenticated on sensitive SECURITY DEFINER functions
DO $$
DECLARE
  fn text;
  admin_fns text[] := ARRAY[
    'audit_log_trigger()',
    'audit_trigger_func()',
    'fn_audit_trigger()',
    'trigger_bitrix_alert_notification()',
    'update_carrier_ranking()',
    'update_performance_metrics()',
    'update_device_last_seen()',
    'update_user_rank()',
    'update_updated_at_column()',
    'handle_updated_at()',
    'handle_new_user()',
    'handle_new_user_levels()',
    'log_biometric_anomaly()',
    'notify_coleta_atrasada()',
    'notify_entrega_atrasada()',
    'notify_entrega_concluida()',
    'notify_ocorrencia_registrada()',
    'notify_frete_interno_concluido()',
    'notify_conquista_desbloqueada()',
    'generate_coleta_numero()',
    'generate_entrega_numero()',
    'increment_version()',
    'increment_version_column()',
    'handle_optimistic_locking()',
    'tr_increment_version()',
    'validate_frete_values()',
    'validate_payload_schema(text, jsonb)',
    'reconcile_pending_freights()',
    'system_health_check()',
    'record_heartbeat()',
    'alert_slow_queries(integer)',
    'cleanup_old_notifications(integer)',
    'cleanup_old_telemetry_logs(integer)',
    'cleanup_old_telemetry_logs()',
    'drop_old_partitions(text, text, integer)',
    'execute_nexus_protocol(text, text)',
    'add_user_xp(uuid, integer, integer)',
    'update_user_streak(uuid)',
    'purchase_reward(uuid, uuid)'
  ];
BEGIN
  FOREACH fn IN ARRAY admin_fns LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', fn);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipping %: %', fn, SQLERRM;
    END;
  END LOOP;
END$$;

-- Read-only helpers exposed to authenticated users
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_organization_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_carrier_performance_stats() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_monthly_analytics(timestamptz, timestamptz) TO authenticated, service_role;

-- Public tracking stays anonymous
GRANT EXECUTE ON FUNCTION public.get_public_tracking(text) TO anon, authenticated, service_role;

-- Pure/IMMUTABLE helpers — safe to expose
ALTER FUNCTION public.xp_for_level(integer) SECURITY INVOKER;
ALTER FUNCTION public.calculate_level(integer) SECURITY INVOKER;
GRANT EXECUTE ON FUNCTION public.xp_for_level(integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.calculate_level(integer) TO anon, authenticated, service_role;

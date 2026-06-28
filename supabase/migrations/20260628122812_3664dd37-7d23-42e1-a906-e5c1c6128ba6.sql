
-- Trigger-only functions (não devem ser chamadas diretamente)
DO $$
DECLARE fn text;
BEGIN
  FOR fn IN SELECT unnest(ARRAY[
    'public.audit_log_trigger()',
    'public.audit_trigger_func()',
    'public.fn_audit_trigger()',
    'public.generate_coleta_numero()',
    'public.generate_entrega_numero()',
    'public.handle_new_user()',
    'public.handle_new_user_levels()',
    'public.log_biometric_anomaly()',
    'public.notify_coleta_atrasada()',
    'public.notify_conquista_desbloqueada()',
    'public.notify_entrega_atrasada()',
    'public.notify_entrega_concluida()',
    'public.notify_frete_interno_concluido()',
    'public.notify_ocorrencia_registrada()',
    'public.trigger_bitrix_alert_notification()',
    'public.update_carrier_ranking()',
    'public.update_device_last_seen()',
    'public.update_user_rank()',
    'public.cleanup_old_telemetry_logs()',
    'public.cleanup_old_telemetry_logs(integer)',
    'public.execute_nexus_protocol(text, text)',
    'public.reconcile_pending_freights()',
    'public.validate_payload_schema(text, jsonb)',
    'public.get_monthly_analytics(timestamptz, timestamptz)',
    'public.add_user_xp(uuid, integer, integer)'
  ])
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated, public', fn);
  END LOOP;
END$$;

-- Garantir que rastreamento público permanece acessível a anon
GRANT EXECUTE ON FUNCTION public.get_public_tracking(text) TO anon, authenticated;

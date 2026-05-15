-- 1. Hardening SECURITY DEFINER functions with search_path
ALTER FUNCTION public.get_carrier_performance_stats SET search_path = public;
ALTER FUNCTION public.handle_new_user SET search_path = public;
ALTER FUNCTION public.get_user_permissions SET search_path = public;
ALTER FUNCTION public.handle_new_user_levels SET search_path = public;
ALTER FUNCTION public.xp_for_level SET search_path = public;
ALTER FUNCTION public.update_user_streak SET search_path = public;
ALTER FUNCTION public.add_user_xp SET search_path = public;
ALTER FUNCTION public.notify_ocorrencia_registrada SET search_path = public;
ALTER FUNCTION public.fn_audit_trigger SET search_path = public;
ALTER FUNCTION public.calculate_level SET search_path = public;
ALTER FUNCTION public.system_health_check SET search_path = public;
ALTER FUNCTION public.update_device_last_seen SET search_path = public;
ALTER FUNCTION public.generate_entrega_numero SET search_path = public;
ALTER FUNCTION public.generate_coleta_numero SET search_path = public;
ALTER FUNCTION public.notify_coleta_atrasada SET search_path = public;
ALTER FUNCTION public.has_role SET search_path = public;
ALTER FUNCTION public.has_permission SET search_path = public;
ALTER FUNCTION public.get_dashboard_metrics SET search_path = public;
ALTER FUNCTION public.audit_trigger_func SET search_path = public;
ALTER FUNCTION public.notify_conquista_desbloqueada SET search_path = public;
ALTER FUNCTION public.audit_log_trigger SET search_path = public;
ALTER FUNCTION public.get_leaderboard SET search_path = public;
ALTER FUNCTION public.notify_entrega_concluida SET search_path = public;
ALTER FUNCTION public.notify_entrega_atrasada SET search_path = public;
ALTER FUNCTION public.cleanup_old_telemetry_logs SET search_path = public;
ALTER FUNCTION public.notify_frete_interno_concluido SET search_path = public;
ALTER FUNCTION public.get_public_tracking SET search_path = public;
ALTER FUNCTION public.purchase_reward SET search_path = public;

-- 2. Revoke public execute on sensitive functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_levels FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_telemetry_logs FROM PUBLIC;
-- REVOKE EXECUTE ON FUNCTION public.fn_audit_trigger FROM PUBLIC; -- Trigger functions might need execution
-- REVOKE EXECUTE ON FUNCTION public.audit_trigger_func FROM PUBLIC;
-- REVOKE EXECUTE ON FUNCTION public.audit_log_trigger FROM PUBLIC;

-- 3. Performance: Add GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_audit_logs_new_data_gin ON public.audit_logs USING GIN (new_data);
CREATE INDEX IF NOT EXISTS idx_audit_logs_old_data_gin ON public.audit_logs USING GIN (old_data);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_metadata_gin ON public.ai_chat_messages USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_ai_delay_predictions_data_gin ON public.ai_delay_predictions USING GIN (prediction_data);

-- 4. Audit Trail for non-partitioned tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT relname 
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' 
        AND c.relkind = 'r' -- regular table
        AND NOT c.relispartition -- not a partition
        AND relname NOT LIKE 'audit_logs%'
        AND relname NOT IN ('schema_migrations', 'architecture_decisions')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS audit_log_trigger ON public.%I', t);
        EXECUTE format('CREATE TRIGGER audit_log_trigger AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION audit_log_trigger()', t);
    END LOOP;
END;
$$;

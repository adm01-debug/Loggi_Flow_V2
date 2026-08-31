
-- Set search_path on remaining trigger/utility functions
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.validate_frete_values() SET search_path = public;
ALTER FUNCTION public.increment_version() SET search_path = public;
ALTER FUNCTION public.increment_version_column() SET search_path = public;

-- Revoke PUBLIC EXECUTE on internal SECURITY DEFINER functions (PUBLIC includes anon)
REVOKE EXECUTE ON FUNCTION public.add_user_xp(uuid, integer, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_trigger_func() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_level(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_telemetry_logs() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_audit_trigger() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_coleta_numero() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_entrega_numero() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_carrier_performance_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(integer, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_permissions(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_levels() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_coleta_atrasada() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_conquista_desbloqueada() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_entrega_atrasada() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_entrega_concluida() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_frete_interno_concluido() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_ocorrencia_registrada() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purchase_reward(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_device_last_seen() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_user_streak(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.xp_for_level(integer) FROM PUBLIC;

-- Re-grant to authenticated for user-callable RPCs
GRANT EXECUTE ON FUNCTION public.add_user_xp(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_level(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_carrier_performance_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purchase_reward(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_streak(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.xp_for_level(integer) TO authenticated;

-- Tighten remaining "WITH CHECK true" insert policies — require authenticated session
DROP POLICY IF EXISTS "Allow systems/users to insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert geo blocked attempts" ON public.geo_blocked_attempts;
CREATE POLICY "Authenticated can log geo blocked attempts" ON public.geo_blocked_attempts
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert login attempts" ON public.login_attempts;
CREATE POLICY "Authenticated can log login attempts" ON public.login_attempts
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Authenticated can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Service inserts rastreamento_alertas" ON public.rastreamento_alertas;
CREATE POLICY "Authenticated can insert rastreamento alertas" ON public.rastreamento_alertas
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Service inserts tracking data" ON public.rastreamento_historico;
CREATE POLICY "Authenticated can insert tracking data" ON public.rastreamento_historico
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert rate limit logs" ON public.rate_limit_logs;
CREATE POLICY "Authenticated can insert rate limit logs" ON public.rate_limit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert rule logs" ON public.rule_execution_logs;
CREATE POLICY "Authenticated can insert rule logs" ON public.rule_execution_logs
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "System can insert security events" ON public.security_events;
CREATE POLICY "Authenticated can insert security events" ON public.security_events
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can insert telemetry logs" ON public.telemetry_logs;
CREATE POLICY "Authenticated can insert telemetry logs" ON public.telemetry_logs
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Backend inserts user achievements" ON public.user_achievements;
CREATE POLICY "Authenticated can insert user achievements" ON public.user_achievements
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Backend inserts user levels" ON public.user_levels;
CREATE POLICY "Authenticated can insert user levels" ON public.user_levels
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Service can insert webhook deliveries" ON public.webhook_deliveries;
CREATE POLICY "Authenticated can insert webhook deliveries" ON public.webhook_deliveries
  FOR INSERT TO authenticated WITH CHECK (true);

-- Tighten audit_logs partition INSERT policies
DO $$
DECLARE
  partition_name TEXT;
BEGIN
  FOR partition_name IN
    SELECT c.relname FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public'
      AND (c.relname LIKE 'audit_logs_y%' OR c.relname='audit_logs_old')
      AND c.relkind IN ('r','p')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "System can insert audit logs" ON public.%I', partition_name);
    EXECUTE format(
      'CREATE POLICY "Authenticated can insert audit logs" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)',
      partition_name
    );
  END LOOP;
END $$;

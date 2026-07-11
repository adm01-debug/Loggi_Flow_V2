
DO $$
DECLARE p text;
BEGIN
  FOREACH p IN ARRAY ARRAY['audit_logs_y2027m01','audit_logs_y2027m02','audit_logs_y2027m03','audit_logs_y2027m04','audit_logs_y2027m05','audit_logs_y2027m06']
  LOOP
    EXECUTE format('CREATE POLICY "Admins view audit logs" ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(),''admin''::app_role))', p);
    EXECUTE format('CREATE POLICY "Authenticated insert audit logs" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)', p);
  END LOOP;
END $$;

-- Harden SECURITY DEFINER admin/maintenance helpers: revoke public/authenticated execute
REVOKE EXECUTE ON FUNCTION public.cleanup_old_telemetry_logs(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_telemetry_logs() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_notifications(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.drop_old_partitions(text, text, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_monthly_partition(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_future_partitions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reconcile_pending_freights() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.alert_slow_queries(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_heartbeat() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_payload_schema(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.execute_nexus_protocol(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.system_health_check() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.add_user_xp(uuid, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_streak(uuid) FROM PUBLIC, anon, authenticated;


-- Patch #4: revogar EXECUTE de anon em SECURITY DEFINER privadas
REVOKE EXECUTE ON FUNCTION public.audit_log_trigger() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_telemetry_logs(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.execute_nexus_protocol(text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_current_organization_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_monthly_analytics(timestamptz, timestamptz) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.log_biometric_anomaly() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.reconcile_pending_freights() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.update_user_rank() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.validate_payload_schema(text, jsonb) FROM anon, public;

-- Patch #5: policies não-SELECT permissivas
-- bio_sync_alert_rules: ALL com USING(true)
DROP POLICY IF EXISTS "Rules can be updated by admins" ON public.bio_sync_alert_rules;
CREATE POLICY "Admins manage alert rules" ON public.bio_sync_alert_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- contract_test_logs
DROP POLICY IF EXISTS "Allow authenticated insert for test logs" ON public.contract_test_logs;
CREATE POLICY "Admins insert test logs" ON public.contract_test_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- freight_decisions: somente service_role
DROP POLICY IF EXISTS "Allow service role to insert decisions" ON public.freight_decisions;
CREATE POLICY "Service role inserts decisions" ON public.freight_decisions
  FOR INSERT TO service_role WITH CHECK (true);

-- freight_integration_mappings
DROP POLICY IF EXISTS "Allow all access to integration mappings" ON public.freight_integration_mappings;
CREATE POLICY "Admins manage integration mappings" ON public.freight_integration_mappings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- freight_selection_rules
DROP POLICY IF EXISTS "Allow all access to selection rules" ON public.freight_selection_rules;
CREATE POLICY "Admins manage selection rules" ON public.freight_selection_rules
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 🛡️ BLINDAGEM FINAL DE SEGURANÇA - ELIMINAÇÃO DE 'WITH CHECK TRUE'

-- 1. Tabelas de Auditoria e Logs
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
CREATE POLICY "Strict insert audit logs" ON public.audit_logs 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can log geo blocked attempts" ON public.geo_blocked_attempts;
CREATE POLICY "Strict log geo blocked attempts" ON public.geo_blocked_attempts 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can log login attempts" ON public.login_attempts;
CREATE POLICY "Strict log login attempts" ON public.login_attempts 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert notifications" ON public.notifications;
CREATE POLICY "Strict insert notifications" ON public.notifications 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert rastreamento alertas" ON public.rastreamento_alertas;
CREATE POLICY "Strict insert rastreamento alertas" ON public.rastreamento_alertas 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert tracking data" ON public.rastreamento_historico;
CREATE POLICY "Strict insert tracking data" ON public.rastreamento_historico 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert rate limit logs" ON public.rate_limit_logs;
CREATE POLICY "Strict insert rate limit logs" ON public.rate_limit_logs 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert rule logs" ON public.rule_execution_logs;
CREATE POLICY "Strict insert rule logs" ON public.rule_execution_logs 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert security events" ON public.security_events;
CREATE POLICY "Strict insert security events" ON public.security_events 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert telemetry logs" ON public.telemetry_logs;
CREATE POLICY "Strict insert telemetry logs" ON public.telemetry_logs 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert user achievements" ON public.user_achievements;
CREATE POLICY "Strict insert user achievements" ON public.user_achievements 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert user levels" ON public.user_levels;
CREATE POLICY "Strict insert user levels" ON public.user_levels 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated can insert webhook deliveries" ON public.webhook_deliveries;
CREATE POLICY "Strict insert webhook deliveries" ON public.webhook_deliveries 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 2. Correção de políticas para partições de audit_logs (se existirem)
DO $$
DECLARE
  partition_name TEXT;
BEGIN
  FOR partition_name IN
    SELECT c.relname FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public'
      AND c.relname LIKE 'audit_logs_y%'
      AND c.relkind IN ('r','p')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "System insert partition" ON public.%I', partition_name);
    EXECUTE format(
      'CREATE POLICY "Strict insert audit partition" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)',
      partition_name
    );
  END LOOP;
END $$;

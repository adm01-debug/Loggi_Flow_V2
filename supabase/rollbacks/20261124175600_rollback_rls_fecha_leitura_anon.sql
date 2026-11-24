-- Desfaz 20261124175600_rls_fecha_leitura_anon.sql, devolvendo as 3 policies para TO public USING (true).
-- ATENCAO: reabre a leitura anonima dessas 3 tabelas. Use apenas se alguma tela passar a exigir acesso sem login.
DROP POLICY IF EXISTS "Regras de alerta visíveis a usuários autenticados" ON public.bio_sync_alert_rules;
CREATE POLICY "Rules are viewable by everyone" ON public.bio_sync_alert_rules
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Heartbeat visível a usuários autenticados" ON public.system_heartbeat;
CREATE POLICY "All users can view heartbeat" ON public.system_heartbeat
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Ranks visíveis a usuários autenticados" ON public.user_ranks;
CREATE POLICY "Ranks são visíveis por todos" ON public.user_ranks
  FOR SELECT TO public USING (true);

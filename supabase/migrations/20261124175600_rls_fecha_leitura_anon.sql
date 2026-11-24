-- Fecha leitura anônima em 3 tabelas que tinham SELECT TO public USING (true).
-- Com o repositório público e a chave anon no histórico, "public" significava leitura
-- integral da tabela por qualquer portador da chave anon, sem login.
-- As 3 tabelas só são consumidas por telas sob ProtectedRoute, então authenticated cobre o uso real.
DROP POLICY IF EXISTS "Rules are viewable by everyone" ON public.bio_sync_alert_rules;
CREATE POLICY "Regras de alerta visíveis a usuários autenticados" ON public.bio_sync_alert_rules
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "All users can view heartbeat" ON public.system_heartbeat;
CREATE POLICY "Heartbeat visível a usuários autenticados" ON public.system_heartbeat
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Ranks são visíveis por todos" ON public.user_ranks;
CREATE POLICY "Ranks visíveis a usuários autenticados" ON public.user_ranks
  FOR SELECT TO authenticated USING (true);

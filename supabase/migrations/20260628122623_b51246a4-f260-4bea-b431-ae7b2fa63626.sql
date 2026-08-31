
-- 1. organizations: sem policy = bloqueada. Restringir a admins.
CREATE POLICY "Admins manage organizations" ON public.organizations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated read organizations" ON public.organizations
  FOR SELECT TO authenticated USING (true);

-- 2. bio_sync_telemetry: dados biométricos sensíveis expostos publicamente
DROP POLICY IF EXISTS "Public read access for bio" ON public.bio_sync_telemetry;
DROP POLICY IF EXISTS "Public insert access for bio" ON public.bio_sync_telemetry;

CREATE POLICY "Authenticated read bio telemetry" ON public.bio_sync_telemetry
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert bio telemetry" ON public.bio_sync_telemetry
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. nexus_tactical_logs: logs táticos expostos publicamente
DROP POLICY IF EXISTS "Public read access for logs" ON public.nexus_tactical_logs;
DROP POLICY IF EXISTS "Public insert access for logs" ON public.nexus_tactical_logs;

CREATE POLICY "Authenticated read tactical logs" ON public.nexus_tactical_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert tactical logs" ON public.nexus_tactical_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. carrier_rankings: público -> autenticado
DROP POLICY IF EXISTS "All users can view carrier rankings" ON public.carrier_rankings;
CREATE POLICY "Authenticated view carrier rankings" ON public.carrier_rankings
  FOR SELECT TO authenticated USING (true);

-- 5. kanban_history: público -> autenticado
DROP POLICY IF EXISTS "Everyone can view kanban history" ON public.kanban_history;
DROP POLICY IF EXISTS "Authenticated users can insert kanban history" ON public.kanban_history;
CREATE POLICY "Authenticated view kanban history" ON public.kanban_history
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated insert kanban history" ON public.kanban_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- 6. transportadoras: remover policies duplicadas/permissivas
DROP POLICY IF EXISTS "Enable read access for all users" ON public.transportadoras;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.transportadoras;
-- "Authenticated users can view transportadoras" já existe restrita a authenticated

-- 7. Revogar grants ao anon nas tabelas sensíveis (defesa em profundidade)
REVOKE ALL ON public.bio_sync_telemetry FROM anon;
REVOKE ALL ON public.nexus_tactical_logs FROM anon;
REVOKE ALL ON public.carrier_rankings FROM anon;
REVOKE ALL ON public.kanban_history FROM anon;
REVOKE ALL ON public.transportadoras FROM anon;
REVOKE ALL ON public.organizations FROM anon;


-- Fix user_roles: drop the {public} scoped ALL policy and keep only the {authenticated} specific ones
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Fix query_telemetry: enforce user_id matches auth.uid()
DROP POLICY IF EXISTS "Authenticated users can insert telemetry" ON public.query_telemetry;
CREATE POLICY "Users can insert own telemetry"
ON public.query_telemetry FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Remove remaining operational tables from Realtime to eliminate channel authorization issue
ALTER PUBLICATION supabase_realtime DROP TABLE public.coletas;
ALTER PUBLICATION supabase_realtime DROP TABLE public.entregas;
ALTER PUBLICATION supabase_realtime DROP TABLE public.cotacoes_multicanal;

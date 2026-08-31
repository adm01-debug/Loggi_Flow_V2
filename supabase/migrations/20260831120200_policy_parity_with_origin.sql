-- Auditoria 2026-08-31: paridade de policies com a origem (hgicfqjayrjurivtygqf).
-- Remove 9 policies que so existiam no destino (5 quase-duplicatas com nome diferente + 4 extras, incluindo
-- user_levels."Users can update own level", que permitia ao usuario alterar o proprio XP) e recria as 7 da origem
-- que a etapa 33 nao tinha criado. Alinha o texto de 2 policies (USING (true) como na origem).
DROP POLICY IF EXISTS "Usuários autenticados podem criar comentários" ON public.comments;
DROP POLICY IF EXISTS "Usuários podem editar seus próprios comentários" ON public.comments;
DROP POLICY IF EXISTS "Usuários podem excluir seus próprios comentários" ON public.comments;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can update own level" ON public.user_levels;
DROP POLICY IF EXISTS "Users can create their own comments" ON public.comments;
CREATE POLICY "Users can create their own comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
CREATE POLICY "Users can update their own comments" ON public.comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Authenticated users can insert fretes_internos" ON public.fretes_internos;
CREATE POLICY "Authenticated users can insert fretes_internos" ON public.fretes_internos FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Authenticated users can view fretes_internos" ON public.fretes_internos;
CREATE POLICY "Authenticated users can view fretes_internos" ON public.fretes_internos FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO public USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO public USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Authenticated users can view coletas" ON public.coletas;
CREATE POLICY "Authenticated users can view coletas" ON public.coletas FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can view entregas" ON public.entregas;
CREATE POLICY "Authenticated users can view entregas" ON public.entregas FOR SELECT TO authenticated USING (true);
COMMENT ON COLUMN public.user_levels.nexus_score IS 'Core Nexus Score (0-100): logistics performance composite metric used by useGamification hook';

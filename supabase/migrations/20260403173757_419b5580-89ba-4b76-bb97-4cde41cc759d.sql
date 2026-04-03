
-- Remove remaining sensitive tables from Realtime
ALTER PUBLICATION supabase_realtime DROP TABLE public.conciliacao_itens_importados;
ALTER PUBLICATION supabase_realtime DROP TABLE public.notificacoes_custo;

-- Prevent non-admin privilege escalation on user_roles
-- Add explicit restrictive INSERT policy: only admins can add roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Only admins can insert roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), ''admin''))';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Only admins can update roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Only admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Only admins can delete roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Only admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), ''admin''))';
  END IF;
END $$;

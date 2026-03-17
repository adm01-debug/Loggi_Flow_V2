-- Remove duplicate permissive INSERT policy on conciliacoes
-- Keep only the admin-restricted one
DROP POLICY IF EXISTS "Authenticated users can create conciliacoes" ON public.conciliacoes;

-- Final security hardening: fix remaining conflicting policies

-- 1. FRETES_INTERNOS: Remove broad policies
DROP POLICY IF EXISTS "View fretes_internos" ON public.fretes_internos;
DROP POLICY IF EXISTS "Update fretes_internos" ON public.fretes_internos;
DROP POLICY IF EXISTS "Insert fretes_internos" ON public.fretes_internos;
DROP POLICY IF EXISTS "Delete fretes_internos" ON public.fretes_internos;

-- 2. OCORRENCIAS: Remove broad UPDATE
DROP POLICY IF EXISTS "Update ocorrencias" ON public.ocorrencias;

-- 3. RASTREAMENTO_ALERTAS: Restrict INSERT/UPDATE
DROP POLICY IF EXISTS "Authenticated users can insert rastreamento_alertas" ON public.rastreamento_alertas;
DROP POLICY IF EXISTS "Authenticated users can update rastreamento_alertas" ON public.rastreamento_alertas;
DROP POLICY IF EXISTS "Insert rastreamento_alertas" ON public.rastreamento_alertas;
DROP POLICY IF EXISTS "Update rastreamento_alertas" ON public.rastreamento_alertas;

CREATE POLICY "Service inserts rastreamento_alertas" ON public.rastreamento_alertas
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Admins can update rastreamento_alertas" ON public.rastreamento_alertas
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));


-- Remove políticas permissivas existentes
DROP POLICY IF EXISTS "Allow all access to clientes" ON public.clientes;
DROP POLICY IF EXISTS "Allow all access to fornecedores" ON public.fornecedores;
DROP POLICY IF EXISTS "Allow all access to entregas" ON public.entregas;
DROP POLICY IF EXISTS "Allow all access to coletas" ON public.coletas;
DROP POLICY IF EXISTS "Allow all access to transportadoras" ON public.transportadoras;
DROP POLICY IF EXISTS "Allow all access to ocorrencias" ON public.ocorrencias;
DROP POLICY IF EXISTS "Allow all access to fretes_internos" ON public.fretes_internos;

-- ===========================================
-- CLIENTES - Apenas usuários autenticados
-- ===========================================
CREATE POLICY "Authenticated users can view clientes"
ON public.clientes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert clientes"
ON public.clientes FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update clientes"
ON public.clientes FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clientes"
ON public.clientes FOR DELETE
TO authenticated
USING (true);

-- ===========================================
-- FORNECEDORES - Apenas usuários autenticados
-- ===========================================
CREATE POLICY "Authenticated users can view fornecedores"
ON public.fornecedores FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert fornecedores"
ON public.fornecedores FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update fornecedores"
ON public.fornecedores FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete fornecedores"
ON public.fornecedores FOR DELETE
TO authenticated
USING (true);

-- ===========================================
-- ENTREGAS - Apenas usuários autenticados
-- ===========================================
CREATE POLICY "Authenticated users can view entregas"
ON public.entregas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert entregas"
ON public.entregas FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update entregas"
ON public.entregas FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete entregas"
ON public.entregas FOR DELETE
TO authenticated
USING (true);

-- ===========================================
-- COLETAS - Apenas usuários autenticados
-- ===========================================
CREATE POLICY "Authenticated users can view coletas"
ON public.coletas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert coletas"
ON public.coletas FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update coletas"
ON public.coletas FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete coletas"
ON public.coletas FOR DELETE
TO authenticated
USING (true);

-- ===========================================
-- TRANSPORTADORAS - Apenas usuários autenticados
-- ===========================================
CREATE POLICY "Authenticated users can view transportadoras"
ON public.transportadoras FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert transportadoras"
ON public.transportadoras FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update transportadoras"
ON public.transportadoras FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete transportadoras"
ON public.transportadoras FOR DELETE
TO authenticated
USING (true);

-- ===========================================
-- OCORRENCIAS - Apenas usuários autenticados
-- ===========================================
CREATE POLICY "Authenticated users can view ocorrencias"
ON public.ocorrencias FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert ocorrencias"
ON public.ocorrencias FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update ocorrencias"
ON public.ocorrencias FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete ocorrencias"
ON public.ocorrencias FOR DELETE
TO authenticated
USING (true);

-- ===========================================
-- FRETES_INTERNOS - Apenas usuários autenticados
-- ===========================================
CREATE POLICY "Authenticated users can view fretes_internos"
ON public.fretes_internos FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert fretes_internos"
ON public.fretes_internos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update fretes_internos"
ON public.fretes_internos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete fretes_internos"
ON public.fretes_internos FOR DELETE
TO authenticated
USING (true);


-- Allow public (unauthenticated) read access to entregas for public tracking page
-- Only expose specific columns via the query, RLS just allows SELECT
CREATE POLICY "Public can view entregas for tracking" ON public.entregas
  FOR SELECT TO anon
  USING (
    codigo_rastreamento IS NOT NULL 
    OR nf_remessa IS NOT NULL
  );

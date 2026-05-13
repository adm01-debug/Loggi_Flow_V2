-- Tighten INSERT policy for audit_logs
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Ensure partitions also have strict policies (if not automatically inherited)
-- Note: In Supabase/Postgres, it's safer to ensure the parent is correct.

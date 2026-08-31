
-- Fix password_reset_requests: replace WITH CHECK(true) - this is public but should validate email
DROP POLICY IF EXISTS "Anyone can create password reset requests" ON public.password_reset_requests;

CREATE POLICY "Anyone can create password reset requests" ON public.password_reset_requests
  FOR INSERT TO public
  WITH CHECK (email IS NOT NULL AND length(email) > 0);

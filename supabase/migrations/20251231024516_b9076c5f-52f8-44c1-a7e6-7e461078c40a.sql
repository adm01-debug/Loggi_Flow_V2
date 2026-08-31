-- Create password reset requests table
CREATE TABLE public.password_reset_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view and manage all requests
CREATE POLICY "Admins can manage password reset requests"
ON public.password_reset_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Anyone can insert (for requesting reset)
CREATE POLICY "Anyone can create password reset requests"
ON public.password_reset_requests
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_password_reset_requests_status ON public.password_reset_requests(status);
CREATE INDEX idx_password_reset_requests_email ON public.password_reset_requests(email);
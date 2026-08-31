-- Create the telemetry_logs table
CREATE TABLE IF NOT EXISTS public.telemetry_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    stack_trace TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id),
    device_info JSONB DEFAULT '{}'::jsonb,
    url TEXT
);

-- Enable RLS
ALTER TABLE public.telemetry_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can insert telemetry logs" 
ON public.telemetry_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admins can view all telemetry logs" 
ON public.telemetry_logs 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
);

-- Create a function to delete old telemetry logs
CREATE OR REPLACE FUNCTION public.cleanup_old_telemetry_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM public.telemetry_logs
    WHERE created_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_telemetry_logs_category ON public.telemetry_logs(category);
CREATE INDEX IF NOT EXISTS idx_telemetry_logs_severity ON public.telemetry_logs(severity);
CREATE INDEX IF NOT EXISTS idx_telemetry_logs_created_at ON public.telemetry_logs(created_at DESC);

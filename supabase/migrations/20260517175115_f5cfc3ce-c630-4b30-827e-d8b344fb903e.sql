-- Create freight_decisions table
CREATE TABLE public.freight_decisions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    request_params JSONB NOT NULL,
    selected_carrier_id UUID REFERENCES public.transportadoras(id),
    selected_carrier_name TEXT,
    recommendations JSONB NOT NULL, -- The full list with scores
    rule_applied JSONB, -- Weights used
    status TEXT DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.freight_decisions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own freight decisions"
ON public.freight_decisions
FOR SELECT
USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Allow service role to insert decisions"
ON public.freight_decisions
FOR INSERT
WITH CHECK (true);

-- Add index for performance
CREATE INDEX idx_freight_decisions_created_at ON public.freight_decisions(created_at DESC);

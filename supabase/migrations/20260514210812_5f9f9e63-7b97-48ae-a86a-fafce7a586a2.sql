-- Create table for AI delay predictions caching
CREATE TABLE IF NOT EXISTS public.ai_delay_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL, -- Reference to entrega or coleta ID
  entity_type TEXT NOT NULL CHECK (entity_type IN ('entrega', 'coleta')),
  prediction_data JSONB NOT NULL,
  risco TEXT NOT NULL,
  probabilidade_atraso INTEGER NOT NULL,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_delay_predictions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view AI delay predictions" 
ON public.ai_delay_predictions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage AI delay predictions" 
ON public.ai_delay_predictions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_ai_delay_predictions_entity ON public.ai_delay_predictions(entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_delay_predictions_analyzed ON public.ai_delay_predictions(analyzed_at);

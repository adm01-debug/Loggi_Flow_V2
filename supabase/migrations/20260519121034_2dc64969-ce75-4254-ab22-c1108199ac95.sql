-- Create kanban_history table for card tracking
CREATE TABLE IF NOT EXISTS public.kanban_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_id UUID NOT NULL REFERENCES public.entregas(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    action_by UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kanban_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view kanban history" 
ON public.kanban_history FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert kanban history" 
ON public.kanban_history FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Add tags column to entregas if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entregas' AND column_name = 'tags') THEN
        ALTER TABLE public.entregas ADD COLUMN tags TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_kanban_history_delivery_id ON public.kanban_history(delivery_id);

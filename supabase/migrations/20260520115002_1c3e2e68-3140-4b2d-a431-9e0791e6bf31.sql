-- Add new columns to coletas
ALTER TABLE public.coletas 
ADD COLUMN is_reverse BOOLEAN DEFAULT false,
ADD COLUMN is_urgent BOOLEAN DEFAULT false,
ADD COLUMN custo_estimado NUMERIC(10,2) DEFAULT 0,
ADD COLUMN custo_real NUMERIC(10,2) DEFAULT 0;

-- Update RLS (Ensure they are enabled and restrictive if not already)
-- Assuming they are already enabled, just making sure.

-- Add index for performance on urgent/reverse
CREATE INDEX idx_coletas_flags ON public.coletas(is_reverse, is_urgent, status);
-- Optimistic Locking Infrastructure
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0;
ALTER TABLE public.coletas ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0;
ALTER TABLE public.transportadoras ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0;

-- Function to increment version
CREATE OR REPLACE FUNCTION public.increment_version_column()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.version = COALESCE(OLD.version, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS tr_version_entregas ON public.entregas;
CREATE TRIGGER tr_version_entregas
BEFORE UPDATE ON public.entregas
FOR EACH ROW
EXECUTE FUNCTION public.increment_version_column();

DROP TRIGGER IF EXISTS tr_version_coletas ON public.coletas;
CREATE TRIGGER tr_version_coletas
BEFORE UPDATE ON public.coletas
FOR EACH ROW
EXECUTE FUNCTION public.increment_version_column();

DROP TRIGGER IF EXISTS tr_version_transportadoras ON public.transportadoras;
CREATE TRIGGER tr_version_transportadoras
BEFORE UPDATE ON public.transportadoras
FOR EACH ROW
EXECUTE FUNCTION public.increment_version_column();

-- Webhook Idempotency Infrastructure
DROP TABLE IF EXISTS public.webhook_events_processed CASCADE;
CREATE TABLE public.webhook_events_processed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  payload JSONB,
  UNIQUE(event_id, provider)
);

-- Index for fast lookups
CREATE INDEX idx_webhook_event_lookup ON public.webhook_events_processed (event_id, provider);

-- Enable RLS
ALTER TABLE public.webhook_events_processed ENABLE ROW LEVEL SECURITY;

-- Security Policies
CREATE POLICY "Public webhook processing access" 
ON public.webhook_events_processed 
FOR ALL 
USING (true)
WITH CHECK (true);

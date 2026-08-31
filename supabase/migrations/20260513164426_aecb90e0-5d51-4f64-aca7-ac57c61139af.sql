-- Optimistic Locking Columns
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entregas' AND column_name = 'version') THEN
        ALTER TABLE public.entregas ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cotacoes_frete' AND column_name = 'version') THEN
        ALTER TABLE public.cotacoes_frete ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transportadoras' AND column_name = 'version') THEN
        ALTER TABLE public.transportadoras ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
END $$;

-- Triggers for Version Increment
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_increment_version_entregas ON public.entregas;
CREATE TRIGGER tr_increment_version_entregas
BEFORE UPDATE ON public.entregas
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION increment_version();

DROP TRIGGER IF EXISTS tr_increment_version_cotacoes_frete ON public.cotacoes_frete;
CREATE TRIGGER tr_increment_version_cotacoes_frete
BEFORE UPDATE ON public.cotacoes_frete
FOR EACH ROW
WHEN (OLD.* IS DISTINCT FROM NEW.*)
EXECUTE FUNCTION increment_version();

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_entregas_status ON public.entregas(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_lookup ON public.webhook_events_processed(provider, external_event_id);

-- Ensure version column exists on all relevant tables
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cotacoes_frete' AND column_name = 'version') THEN
        ALTER TABLE public.cotacoes_frete ADD COLUMN version INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cotacoes_multicanal' AND column_name = 'version') THEN
        ALTER TABLE public.cotacoes_multicanal ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transportadoras' AND column_name = 'version') THEN
        ALTER TABLE public.transportadoras ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'entregas' AND column_name = 'version') THEN
        ALTER TABLE public.entregas ADD COLUMN version INTEGER DEFAULT 1;
    END IF;
END $$;

-- Create trigger function for incrementing version
CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
DROP TRIGGER IF EXISTS tr_entregas_version ON public.entregas;
CREATE TRIGGER tr_entregas_version
BEFORE UPDATE ON public.entregas
FOR EACH ROW
EXECUTE FUNCTION public.increment_version();

DROP TRIGGER IF EXISTS tr_cotacoes_frete_version ON public.cotacoes_frete;
CREATE TRIGGER tr_cotacoes_frete_version
BEFORE UPDATE ON public.cotacoes_frete
FOR EACH ROW
EXECUTE FUNCTION public.increment_version();

DROP TRIGGER IF EXISTS tr_cotacoes_multicanal_version ON public.cotacoes_multicanal;
CREATE TRIGGER tr_cotacoes_multicanal_version
BEFORE UPDATE ON public.cotacoes_multicanal
FOR EACH ROW
EXECUTE FUNCTION public.increment_version();

DROP TRIGGER IF EXISTS tr_transportadoras_version ON public.transportadoras;
CREATE TRIGGER tr_transportadoras_version
BEFORE UPDATE ON public.transportadoras
FOR EACH ROW
EXECUTE FUNCTION public.increment_version();
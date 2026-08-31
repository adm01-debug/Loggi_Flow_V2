-- Add version column for optimistic locking
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS version INT DEFAULT 0;
ALTER TABLE public.cotacoes_frete ADD COLUMN IF NOT EXISTS version INT DEFAULT 0;
ALTER TABLE public.transportadoras ADD COLUMN IF NOT EXISTS version INT DEFAULT 0;

-- Function to increment version
CREATE OR REPLACE FUNCTION public.increment_version_column()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD IS NOT DISTINCT FROM NEW THEN
    RETURN NEW;
  END IF;
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic versioning
DROP TRIGGER IF EXISTS tr_increment_version_entregas ON public.entregas;
CREATE TRIGGER tr_increment_version_entregas
BEFORE UPDATE ON public.entregas
FOR EACH ROW
EXECUTE FUNCTION public.increment_version_column();

DROP TRIGGER IF EXISTS tr_increment_version_cotacoes_frete ON public.cotacoes_frete;
CREATE TRIGGER tr_increment_version_cotacoes_frete
BEFORE UPDATE ON public.cotacoes_frete
FOR EACH ROW
EXECUTE FUNCTION public.increment_version_column();

DROP TRIGGER IF EXISTS tr_increment_version_transportadoras ON public.transportadoras;
CREATE TRIGGER tr_increment_version_transportadoras
BEFORE UPDATE ON public.transportadoras
FOR EACH ROW
EXECUTE FUNCTION public.increment_version_column();
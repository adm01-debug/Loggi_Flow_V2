-- Adicionar coluna de versão para Optimistic Locking
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS version INT DEFAULT 0;
ALTER TABLE public.cotacoes_multicanal ADD COLUMN IF NOT EXISTS version INT DEFAULT 0;
ALTER TABLE public.transportadoras ADD COLUMN IF NOT EXISTS version INT DEFAULT 0;

-- Função para incrementar versão automaticamente
CREATE OR REPLACE FUNCTION public.increment_version_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para incremento de versão
DROP TRIGGER IF EXISTS trigger_increment_version_entregas ON public.entregas;
CREATE TRIGGER trigger_increment_version_entregas
BEFORE UPDATE ON public.entregas
FOR EACH ROW EXECUTE FUNCTION public.increment_version_column();

DROP TRIGGER IF EXISTS trigger_increment_version_cotacoes ON public.cotacoes_multicanal;
CREATE TRIGGER trigger_increment_version_cotacoes
BEFORE UPDATE ON public.cotacoes_multicanal
FOR EACH ROW EXECUTE FUNCTION public.increment_version_column();

DROP TRIGGER IF EXISTS trigger_increment_version_transportadoras ON public.transportadoras;
CREATE TRIGGER trigger_increment_version_transportadoras
BEFORE UPDATE ON public.transportadoras
FOR EACH ROW EXECUTE FUNCTION public.increment_version_column();

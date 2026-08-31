-- Adicionar coluna de versão para controle de concorrência otimista
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Função para incrementar a versão
CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para incrementar versão na tabela entregas
DROP TRIGGER IF EXISTS tr_increment_entrega_version ON public.entregas;
CREATE TRIGGER tr_increment_entrega_version
BEFORE UPDATE ON public.entregas
FOR EACH ROW
EXECUTE FUNCTION public.increment_version();

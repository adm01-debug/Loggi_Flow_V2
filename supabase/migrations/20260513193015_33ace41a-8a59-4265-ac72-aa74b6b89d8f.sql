-- Adicionar coluna de versão para Optimistic Locking
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0;
ALTER TABLE public.cotacoes_frete ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0;
ALTER TABLE public.transportadoras ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0;

-- Função para incrementar versão
CREATE OR REPLACE FUNCTION public.handle_optimistic_locking()
RETURNS TRIGGER AS $$
BEGIN
  -- Só incrementa se a versão enviada for igual à versão atual
  -- No frontend, deve-se passar o version no WHERE
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para incremento automático
DROP TRIGGER IF EXISTS tr_entregas_optimistic_locking ON public.entregas;
CREATE TRIGGER tr_entregas_optimistic_locking
BEFORE UPDATE ON public.entregas
FOR EACH ROW
EXECUTE FUNCTION public.handle_optimistic_locking();

DROP TRIGGER IF EXISTS tr_cotacoes_frete_optimistic_locking ON public.cotacoes_frete;
CREATE TRIGGER tr_cotacoes_frete_optimistic_locking
BEFORE UPDATE ON public.cotacoes_frete
FOR EACH ROW
EXECUTE FUNCTION public.handle_optimistic_locking();

DROP TRIGGER IF EXISTS tr_transportadoras_optimistic_locking ON public.transportadoras;
CREATE TRIGGER tr_transportadoras_optimistic_locking
BEFORE UPDATE ON public.transportadoras
FOR EACH ROW
EXECUTE FUNCTION public.handle_optimistic_locking();
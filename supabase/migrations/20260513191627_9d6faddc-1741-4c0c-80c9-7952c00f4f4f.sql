-- Adicionar coluna de versão se não existir (idempotência)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entregas' AND column_name='version') THEN
        ALTER TABLE public.entregas ADD COLUMN version INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coletas' AND column_name='version') THEN
        ALTER TABLE public.coletas ADD COLUMN version INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transportadoras' AND column_name='version') THEN
        ALTER TABLE public.transportadoras ADD COLUMN version INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='cotacoes_frete' AND column_name='version') THEN
        ALTER TABLE public.cotacoes_frete ADD COLUMN version INTEGER DEFAULT 0;
    END IF;
END $$;

-- Função genérica para incrementar a versão
CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de versão
DROP TRIGGER IF EXISTS tr_version_entregas ON public.entregas;
CREATE TRIGGER tr_version_entregas
    BEFORE UPDATE ON public.entregas
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_version();

DROP TRIGGER IF EXISTS tr_version_coletas ON public.coletas;
CREATE TRIGGER tr_version_coletas
    BEFORE UPDATE ON public.coletas
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_version();

DROP TRIGGER IF EXISTS tr_version_transportadoras ON public.transportadoras;
CREATE TRIGGER tr_version_transportadoras
    BEFORE UPDATE ON public.transportadoras
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_version();

DROP TRIGGER IF EXISTS tr_version_cotacoes ON public.cotacoes_frete;
CREATE TRIGGER tr_version_cotacoes
    BEFORE UPDATE ON public.cotacoes_frete
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_version();

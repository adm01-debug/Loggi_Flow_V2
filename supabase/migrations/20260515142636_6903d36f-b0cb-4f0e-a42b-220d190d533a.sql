-- Remover chaves estrangeiras duplicadas em coletas
ALTER TABLE public.coletas 
    DROP CONSTRAINT IF EXISTS coletas_fornecedor_id_fkey,
    DROP CONSTRAINT IF EXISTS coletas_transportadora_id_fkey;

-- Garantir que as chaves renomeadas existam e sejam as únicas
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_coletas_fornecedor') THEN
        ALTER TABLE public.coletas ADD CONSTRAINT fk_coletas_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_coletas_transportadora') THEN
        ALTER TABLE public.coletas ADD CONSTRAINT fk_coletas_transportadora FOREIGN KEY (transportadora_id) REFERENCES public.transportadoras(id) ON DELETE SET NULL;
    END IF;
END $$;

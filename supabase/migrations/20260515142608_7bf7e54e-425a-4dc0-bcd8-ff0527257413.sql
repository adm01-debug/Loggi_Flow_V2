-- 0. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Aplicar triggers de updated_at em tabelas principais
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public' 
        AND table_name NOT LIKE 'audit_logs%' 
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS update_%I_updated_at ON %I', t, t);
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t, t);
    END LOOP;
END $$;

-- 3. Adicionar chaves estrangeiras na tabela coletas
ALTER TABLE public.coletas 
    DROP CONSTRAINT IF EXISTS fk_coletas_fornecedor,
    DROP CONSTRAINT IF EXISTS fk_coletas_transportadora;

ALTER TABLE public.coletas
    ADD CONSTRAINT fk_coletas_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES public.fornecedores(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_coletas_transportadora FOREIGN KEY (transportadora_id) REFERENCES public.transportadoras(id) ON DELETE SET NULL;

-- 4. Índices de performance
CREATE INDEX IF NOT EXISTS idx_coletas_fornecedor_id ON public.coletas(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_coletas_transportadora_id ON public.coletas(transportadora_id);
CREATE INDEX IF NOT EXISTS idx_coletas_numero_coleta_trgm ON public.coletas USING gin (numero_coleta gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_fornecedores_cnpj ON public.fornecedores(cnpj);
CREATE INDEX IF NOT EXISTS idx_transportadoras_cnpj ON public.transportadoras(cnpj);

-- 5. Soft delete indexes
CREATE INDEX IF NOT EXISTS idx_fornecedores_deleted_at ON public.fornecedores(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transportadoras_deleted_at ON public.transportadoras(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_deleted_at ON public.clientes(deleted_at) WHERE deleted_at IS NULL;

-- Adicionar coluna deleted_at
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.coletas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.transportadoras ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Criar índices para performance nas queries filtradas
CREATE INDEX IF NOT EXISTS idx_entregas_deleted_at ON public.entregas(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_coletas_deleted_at ON public.coletas(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_deleted_at ON public.clientes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_fornecedores_deleted_at ON public.fornecedores(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_transportadoras_deleted_at ON public.transportadoras(deleted_at) WHERE deleted_at IS NULL;

-- Atualizar RLS para esconder deletados por padrão (exemplo para entregas)
-- Nota: As policies existentes precisam ser ajustadas se quiserem ocultar automaticamente.
-- Por enquanto, a filtragem será feita no nível de aplicação (hooks) para evitar quebras em massa.

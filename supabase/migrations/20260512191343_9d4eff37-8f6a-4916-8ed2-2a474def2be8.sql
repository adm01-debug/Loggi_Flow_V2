-- Tabela de Logística Reversa
CREATE TABLE IF NOT EXISTS public.logistica_reversa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entrega_id UUID REFERENCES public.entregas(id),
    cliente_id UUID REFERENCES public.clientes(id),
    motivo TEXT NOT NULL,
    descricao_detalhada TEXT,
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente, aprovado, em_transito, recebido, cancelado
    prioridade TEXT DEFAULT 'normal',
    codigo_rastreio_reverso TEXT,
    valor_estorno DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.logistica_reversa ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Logística Reversa visível para todos os usuários autenticados"
ON public.logistica_reversa FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem inserir solicitações de logística reversa"
ON public.logistica_reversa FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Apenas admins podem atualizar solicitações"
ON public.logistica_reversa FOR UPDATE
USING (auth.uid() IS NOT NULL); -- Em produção, restringir por role

-- Trigger para updated_at
CREATE TRIGGER update_logistica_reversa_updated_at
    BEFORE UPDATE ON public.logistica_reversa
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
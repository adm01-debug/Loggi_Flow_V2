-- Tabela principal de conciliações
CREATE TABLE public.conciliacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('faturas_entregas', 'custos_previstos_realizados', 'pagamentos_notas')),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  periodo_inicio DATE,
  periodo_fim DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'em_andamento', 'concluida', 'arquivada')),
  total_itens_importados INTEGER NOT NULL DEFAULT 0,
  total_itens_conciliados INTEGER NOT NULL DEFAULT 0,
  total_divergencias INTEGER NOT NULL DEFAULT 0,
  valor_total_importado NUMERIC(12,2) DEFAULT 0,
  valor_total_sistema NUMERIC(12,2) DEFAULT 0,
  diferenca_total NUMERIC(12,2) DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Itens importados (do arquivo externo)
CREATE TABLE public.conciliacao_itens_importados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conciliacao_id UUID NOT NULL REFERENCES public.conciliacoes(id) ON DELETE CASCADE,
  linha_arquivo INTEGER,
  referencia_externa VARCHAR(100),
  descricao TEXT,
  data_documento DATE,
  valor NUMERIC(12,2) NOT NULL,
  transportadora_nome VARCHAR(255),
  dados_originais JSONB,
  status VARCHAR(30) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'conciliado', 'divergencia', 'ignorado')),
  item_sistema_id UUID,
  diferenca_valor NUMERIC(12,2),
  observacoes TEXT,
  conciliado_em TIMESTAMP WITH TIME ZONE,
  conciliado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_conciliacoes_tipo ON public.conciliacoes(tipo);
CREATE INDEX idx_conciliacoes_status ON public.conciliacoes(status);
CREATE INDEX idx_conciliacoes_created_by ON public.conciliacoes(created_by);
CREATE INDEX idx_conciliacao_itens_conciliacao_id ON public.conciliacao_itens_importados(conciliacao_id);
CREATE INDEX idx_conciliacao_itens_status ON public.conciliacao_itens_importados(status);
CREATE INDEX idx_conciliacao_itens_referencia ON public.conciliacao_itens_importados(referencia_externa);

-- Enable RLS
ALTER TABLE public.conciliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conciliacao_itens_importados ENABLE ROW LEVEL SECURITY;

-- Policies para conciliacoes
CREATE POLICY "Authenticated users can view conciliacoes" 
ON public.conciliacoes 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create conciliacoes" 
ON public.conciliacoes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update conciliacoes" 
ON public.conciliacoes 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete conciliacoes" 
ON public.conciliacoes 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Policies para itens importados
CREATE POLICY "Authenticated users can view conciliacao_itens_importados" 
ON public.conciliacao_itens_importados 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create conciliacao_itens_importados" 
ON public.conciliacao_itens_importados 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update conciliacao_itens_importados" 
ON public.conciliacao_itens_importados 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete conciliacao_itens_importados" 
ON public.conciliacao_itens_importados 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_conciliacoes_updated_at
BEFORE UPDATE ON public.conciliacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conciliacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conciliacao_itens_importados;
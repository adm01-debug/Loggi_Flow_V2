-- Enum para tipos
CREATE TYPE public.coleta_tipo AS ENUM ('lalamove', 'transportadora');
CREATE TYPE public.coleta_status AS ENUM ('aguardando_liberacao', 'solicitada', 'em_transito', 'chegou_expedicao', 'conferencia_ok', 'divergencia', 'finalizada');
CREATE TYPE public.entrega_status AS ENUM ('aguardando_producao', 'pronto_despacho', 'cotacao_frete', 'nf_emitida', 'despachado', 'em_transito', 'saiu_entrega', 'entregue', 'ocorrencia', 'finalizado');
CREATE TYPE public.frete_tipo AS ENUM ('cif', 'fob', 'cortesia');

-- Tabela de Transportadoras Homologadas
CREATE TABLE public.transportadoras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razao_social TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  nome_fantasia TEXT NOT NULL,
  contato_comercial TEXT NOT NULL,
  email_comercial TEXT NOT NULL,
  whatsapp_operacional TEXT,
  regioes_atendidas TEXT[] DEFAULT '{}',
  prazo_medio_dias INTEGER,
  api_disponivel BOOLEAN DEFAULT FALSE,
  url_rastreamento TEXT,
  homologada BOOLEAN DEFAULT TRUE,
  data_homologacao TIMESTAMP WITH TIME ZONE DEFAULT now(),
  score_performance INTEGER DEFAULT 0,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Fornecedores (para coletas)
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razao_social TEXT NOT NULL,
  cnpj TEXT,
  nome_fantasia TEXT,
  endereco_completo TEXT NOT NULL,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  contato_nome TEXT,
  contato_telefone TEXT,
  contato_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Coletas de Compras
CREATE TABLE public.coletas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_coleta TEXT NOT NULL UNIQUE,
  fornecedor_id UUID REFERENCES public.fornecedores(id),
  endereco_coleta TEXT NOT NULL,
  contato_coleta TEXT,
  tipo_coleta public.coleta_tipo NOT NULL DEFAULT 'lalamove',
  transportadora_id UUID REFERENCES public.transportadoras(id),
  data_prevista_coleta TIMESTAMP WITH TIME ZONE,
  data_efetiva_coleta TIMESTAMP WITH TIME ZONE,
  qtd_volumes INTEGER DEFAULT 1,
  peso_estimado_kg DECIMAL(10,2),
  codigo_rastreamento TEXT,
  link_rastreamento TEXT,
  comprovante_coleta_url TEXT,
  status public.coleta_status NOT NULL DEFAULT 'aguardando_liberacao',
  observacoes TEXT,
  -- Campos de conferência
  qtd_recebida INTEGER,
  divergencia_percentual DECIMAL(5,2),
  nf_fornecedor TEXT,
  nf_anexo_url TEXT,
  responsavel_recebimento TEXT,
  data_recebimento TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razao_social TEXT NOT NULL,
  cnpj TEXT,
  nome_fantasia TEXT,
  endereco_completo TEXT NOT NULL,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  contato_nome TEXT,
  contato_telefone TEXT,
  contato_email TEXT,
  restricoes_entrega TEXT,
  horario_entrega TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Entregas ao Cliente
CREATE TABLE public.entregas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_entrega TEXT NOT NULL UNIQUE,
  cliente_id UUID REFERENCES public.clientes(id),
  endereco_entrega TEXT NOT NULL,
  contato_cliente TEXT,
  transportadora_id UUID REFERENCES public.transportadoras(id),
  valor_frete DECIMAL(10,2),
  tipo_frete public.frete_tipo DEFAULT 'cif',
  nf_remessa TEXT,
  nf_remessa_url TEXT,
  box_alocado TEXT,
  data_despacho TIMESTAMP WITH TIME ZONE,
  codigo_rastreamento TEXT,
  link_rastreamento TEXT,
  previsao_entrega TIMESTAMP WITH TIME ZONE,
  data_entrega_efetiva TIMESTAMP WITH TIME ZONE,
  recebedor TEXT,
  comprovante_entrega_url TEXT,
  status public.entrega_status NOT NULL DEFAULT 'aguardando_producao',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Ocorrências
CREATE TABLE public.ocorrencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entrega_id UUID REFERENCES public.entregas(id),
  coleta_id UUID REFERENCES public.coletas(id),
  tipo_ocorrencia TEXT NOT NULL,
  descricao TEXT,
  fotos_urls TEXT[] DEFAULT '{}',
  acao_tomada TEXT,
  resolvida BOOLEAN DEFAULT FALSE,
  data_resolucao TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de Cotações de Frete
CREATE TABLE public.cotacoes_frete (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entrega_id UUID REFERENCES public.entregas(id) NOT NULL,
  transportadora_id UUID REFERENCES public.transportadoras(id) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  prazo_dias INTEGER,
  selecionada BOOLEAN DEFAULT FALSE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transportadoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotacoes_frete ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (acesso público para demo, em produção adicionar autenticação)
CREATE POLICY "Allow all access to transportadoras" ON public.transportadoras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to fornecedores" ON public.fornecedores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to coletas" ON public.coletas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to entregas" ON public.entregas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to ocorrencias" ON public.ocorrencias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to cotacoes_frete" ON public.cotacoes_frete FOR ALL USING (true) WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_transportadoras_updated_at BEFORE UPDATE ON public.transportadoras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_coletas_updated_at BEFORE UPDATE ON public.coletas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_entregas_updated_at BEFORE UPDATE ON public.entregas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sequência para números automáticos
CREATE SEQUENCE coleta_seq START 1;
CREATE SEQUENCE entrega_seq START 1;

-- Função para gerar número de coleta
CREATE OR REPLACE FUNCTION public.generate_coleta_numero()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero_coleta = 'COL-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('coleta_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar número de entrega
CREATE OR REPLACE FUNCTION public.generate_entrega_numero()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero_entrega = 'ENT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('entrega_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para números automáticos
CREATE TRIGGER generate_coleta_numero_trigger BEFORE INSERT ON public.coletas FOR EACH ROW WHEN (NEW.numero_coleta IS NULL) EXECUTE FUNCTION public.generate_coleta_numero();
CREATE TRIGGER generate_entrega_numero_trigger BEFORE INSERT ON public.entregas FOR EACH ROW WHEN (NEW.numero_entrega IS NULL) EXECUTE FUNCTION public.generate_entrega_numero();
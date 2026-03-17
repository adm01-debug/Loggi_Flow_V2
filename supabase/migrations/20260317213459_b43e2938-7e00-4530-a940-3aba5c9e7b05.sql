
-- Tabela para persistir cotações multi-canal
CREATE TABLE public.cotacoes_multicanal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transportadora_id UUID REFERENCES public.transportadoras(id) ON DELETE CASCADE NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('api', 'whatsapp', 'email')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'respondido', 'expirado', 'selecionado')),
  
  -- Dados do trecho
  origem_estado TEXT NOT NULL,
  origem_cidade TEXT,
  destino_estado TEXT NOT NULL,
  destino_cidade TEXT,
  
  -- Dados da carga
  peso_kg NUMERIC,
  volumes INTEGER DEFAULT 1,
  valor_mercadoria NUMERIC,
  
  -- Resultado da cotação
  valor_cotado NUMERIC,
  prazo_dias INTEGER,
  observacoes TEXT,
  
  -- Timer de expiração (24h por padrão)
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  responded_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.cotacoes_multicanal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage cotacoes_multicanal"
  ON public.cotacoes_multicanal
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.cotacoes_multicanal;

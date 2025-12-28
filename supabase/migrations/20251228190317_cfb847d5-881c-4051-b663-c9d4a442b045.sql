-- Create table for carrier routes (origin-destination mapping)
CREATE TABLE public.transportadora_rotas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transportadora_id UUID NOT NULL REFERENCES public.transportadoras(id) ON DELETE CASCADE,
  
  -- Origin
  origem_estado TEXT NOT NULL,
  origem_cidade TEXT,
  origem_cep_inicio TEXT,
  origem_cep_fim TEXT,
  
  -- Destination
  destino_estado TEXT NOT NULL,
  destino_cidade TEXT,
  destino_cep_inicio TEXT,
  destino_cep_fim TEXT,
  
  -- Route details
  prazo_dias INTEGER DEFAULT 5,
  preco_por_kg NUMERIC DEFAULT 0,
  taxa_fixa NUMERIC DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  observacoes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transportadora_rotas ENABLE ROW LEVEL SECURITY;

-- Create policy for full access (same as transportadoras)
CREATE POLICY "Allow all access to transportadora_rotas" 
ON public.transportadora_rotas 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create indexes for faster lookups
CREATE INDEX idx_rotas_origem ON public.transportadora_rotas(origem_estado, origem_cidade);
CREATE INDEX idx_rotas_destino ON public.transportadora_rotas(destino_estado, destino_cidade);
CREATE INDEX idx_rotas_transportadora ON public.transportadora_rotas(transportadora_id);
CREATE INDEX idx_rotas_cep_origem ON public.transportadora_rotas(origem_cep_inicio, origem_cep_fim);
CREATE INDEX idx_rotas_cep_destino ON public.transportadora_rotas(destino_cep_inicio, destino_cep_fim);

-- Create trigger for updated_at
CREATE TRIGGER update_transportadora_rotas_updated_at
BEFORE UPDATE ON public.transportadora_rotas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for AI chat history
CREATE TABLE public.ai_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own chat history
CREATE POLICY "Users can view their own chat messages" 
ON public.ai_chat_messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages" 
ON public.ai_chat_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" 
ON public.ai_chat_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for user chat history
CREATE INDEX idx_chat_user ON public.ai_chat_messages(user_id, created_at DESC);
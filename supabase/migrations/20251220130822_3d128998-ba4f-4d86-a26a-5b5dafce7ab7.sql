-- Create enum for frete interno status
CREATE TYPE public.frete_interno_status AS ENUM (
  'pendente',
  'em_transito',
  'entregue',
  'atrasado',
  'cancelado'
);

-- Create fretes_internos table
CREATE TABLE public.fretes_internos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  origem TEXT NOT NULL,
  destino TEXT NOT NULL,
  motorista TEXT,
  quantidade_itens INTEGER NOT NULL DEFAULT 1,
  status public.frete_interno_status NOT NULL DEFAULT 'pendente',
  previsao_entrega TIMESTAMP WITH TIME ZONE,
  data_entrega_efetiva TIMESTAMP WITH TIME ZONE,
  xp_reward INTEGER NOT NULL DEFAULT 50,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.fretes_internos ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (open access like other tables in this project)
CREATE POLICY "Allow all access to fretes_internos"
ON public.fretes_internos
FOR ALL
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fretes_internos_updated_at
BEFORE UPDATE ON public.fretes_internos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for common queries
CREATE INDEX idx_fretes_internos_status ON public.fretes_internos(status);
CREATE INDEX idx_fretes_internos_created_at ON public.fretes_internos(created_at DESC);
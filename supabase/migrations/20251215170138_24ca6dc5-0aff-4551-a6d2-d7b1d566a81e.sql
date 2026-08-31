-- Create freight pricing table for carriers
CREATE TABLE public.tabelas_frete (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transportadora_id UUID NOT NULL REFERENCES public.transportadoras(id) ON DELETE CASCADE,
  regiao_destino TEXT NOT NULL,
  estado_destino TEXT NOT NULL,
  peso_min_kg NUMERIC NOT NULL DEFAULT 0,
  peso_max_kg NUMERIC NOT NULL DEFAULT 999999,
  preco_por_kg NUMERIC NOT NULL,
  taxa_fixa NUMERIC NOT NULL DEFAULT 0,
  prazo_dias INTEGER NOT NULL DEFAULT 5,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tabelas_frete ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to access freight tables
CREATE POLICY "Allow all access to tabelas_frete" 
  ON public.tabelas_frete 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_tabelas_frete_updated_at
  BEFORE UPDATE ON public.tabelas_frete
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_tabelas_frete_transportadora ON public.tabelas_frete(transportadora_id);
CREATE INDEX idx_tabelas_frete_estado ON public.tabelas_frete(estado_destino);
CREATE INDEX idx_tabelas_frete_peso ON public.tabelas_frete(peso_min_kg, peso_max_kg);

-- Insert sample freight pricing data for testing
INSERT INTO public.tabelas_frete (transportadora_id, regiao_destino, estado_destino, peso_min_kg, peso_max_kg, preco_por_kg, taxa_fixa, prazo_dias)
SELECT 
  t.id,
  'Sudeste',
  'SP',
  0,
  10,
  5.50,
  25.00,
  2
FROM public.transportadoras t
LIMIT 1;

INSERT INTO public.tabelas_frete (transportadora_id, regiao_destino, estado_destino, peso_min_kg, peso_max_kg, preco_por_kg, taxa_fixa, prazo_dias)
SELECT 
  t.id,
  'Sudeste',
  'SP',
  10,
  50,
  4.80,
  25.00,
  2
FROM public.transportadoras t
LIMIT 1;

INSERT INTO public.tabelas_frete (transportadora_id, regiao_destino, estado_destino, peso_min_kg, peso_max_kg, preco_por_kg, taxa_fixa, prazo_dias)
SELECT 
  t.id,
  'Sudeste',
  'RJ',
  0,
  10,
  7.20,
  35.00,
  3
FROM public.transportadoras t
LIMIT 1;

INSERT INTO public.tabelas_frete (transportadora_id, regiao_destino, estado_destino, peso_min_kg, peso_max_kg, preco_por_kg, taxa_fixa, prazo_dias)
SELECT 
  t.id,
  'Centro-Oeste',
  'GO',
  0,
  10,
  6.00,
  30.00,
  3
FROM public.transportadoras t
LIMIT 1;
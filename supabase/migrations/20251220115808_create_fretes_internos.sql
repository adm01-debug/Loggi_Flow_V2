-- Create enum for frete interno status
CREATE TYPE frete_interno_status AS ENUM (
  'pendente',
  'em_transito', 
  'entregue',
  'atrasado',
  'cancelado'
);

-- Create fretes_internos table
CREATE TABLE IF NOT EXISTS fretes_internos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  origem TEXT NOT NULL,
  destino TEXT NOT NULL,
  motorista TEXT,
  quantidade_itens INTEGER DEFAULT 1,
  status frete_interno_status DEFAULT 'pendente',
  data_criacao TIMESTAMPTZ DEFAULT now(),
  previsao_entrega TIMESTAMPTZ,
  data_entrega_efetiva TIMESTAMPTZ,
  xp_reward INTEGER DEFAULT 50,
  observacoes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index
CREATE INDEX idx_fretes_internos_status ON fretes_internos(status);
CREATE INDEX idx_fretes_internos_created_at ON fretes_internos(created_at DESC);

-- Enable RLS
ALTER TABLE fretes_internos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read for authenticated users" ON fretes_internos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON fretes_internos
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON fretes_internos
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete for authenticated users" ON fretes_internos
  FOR DELETE TO authenticated USING (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_fretes_internos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fretes_internos_updated_at
  BEFORE UPDATE ON fretes_internos
  FOR EACH ROW EXECUTE FUNCTION update_fretes_internos_updated_at();

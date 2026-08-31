-- Tabela de pedidos Lalamove
CREATE TABLE IF NOT EXISTS lalamove_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ASSIGNING_DRIVER',
  driver_name TEXT,
  driver_phone TEXT,
  vehicle_type TEXT,
  plate_number TEXT,
  current_lat DECIMAL(10, 8),
  current_lng DECIMAL(11, 8),
  estimated_arrival TIMESTAMPTZ,
  total_fee DECIMAL(10, 2),
  currency TEXT DEFAULT 'BRL',
  entrega_id UUID REFERENCES entregas(id),
  coleta_id UUID REFERENCES coletas(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de paradas/stops
CREATE TABLE IF NOT EXISTS lalamove_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES lalamove_orders(order_id) ON DELETE CASCADE,
  stop_id TEXT,
  sequence INT,
  address TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de histórico de status
CREATE TABLE IF NOT EXISTS lalamove_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT REFERENCES lalamove_orders(order_id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  driver_lat DECIMAL(10, 8),
  driver_lng DECIMAL(11, 8),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_lalamove_order_id ON lalamove_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_lalamove_status ON lalamove_orders(status);
CREATE INDEX IF NOT EXISTS idx_lalamove_entrega ON lalamove_orders(entrega_id);
CREATE INDEX IF NOT EXISTS idx_lalamove_stops_order ON lalamove_stops(order_id);
CREATE INDEX IF NOT EXISTS idx_lalamove_history_order ON lalamove_status_history(order_id);

-- RLS
ALTER TABLE lalamove_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE lalamove_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE lalamove_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lalamove orders" ON lalamove_orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert lalamove orders" ON lalamove_orders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update lalamove orders" ON lalamove_orders FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view stops" ON lalamove_stops FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage stops" ON lalamove_stops FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view history" ON lalamove_status_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert history" ON lalamove_status_history FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_lalamove_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lalamove_orders_updated_at
BEFORE UPDATE ON lalamove_orders
FOR EACH ROW EXECUTE FUNCTION update_lalamove_updated_at();

-- Migration: Add comprehensive RLS policies for all tables

-- ===== CLIENTS =====
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view clients" ON clientes;
CREATE POLICY "Authenticated users can view clients" ON clientes
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clientes;
CREATE POLICY "Authenticated users can insert clients" ON clientes
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update clients" ON clientes;
CREATE POLICY "Authenticated users can update clients" ON clientes
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clientes;
CREATE POLICY "Authenticated users can delete clients" ON clientes
  FOR DELETE TO authenticated USING (true);

-- ===== FORNECEDORES =====
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view fornecedores" ON fornecedores;
CREATE POLICY "Authenticated users can view fornecedores" ON fornecedores
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage fornecedores" ON fornecedores;
CREATE POLICY "Authenticated users can manage fornecedores" ON fornecedores
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===== COLETAS =====
ALTER TABLE coletas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view coletas" ON coletas;
CREATE POLICY "Authenticated users can view coletas" ON coletas
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage coletas" ON coletas;
CREATE POLICY "Authenticated users can manage coletas" ON coletas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===== ENTREGAS =====
ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view entregas" ON entregas;
CREATE POLICY "Authenticated users can view entregas" ON entregas
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage entregas" ON entregas;
CREATE POLICY "Authenticated users can manage entregas" ON entregas
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===== TRANSPORTADORAS =====
ALTER TABLE transportadoras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view transportadoras" ON transportadoras;
CREATE POLICY "Authenticated users can view transportadoras" ON transportadoras
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage transportadoras" ON transportadoras;
CREATE POLICY "Authenticated users can manage transportadoras" ON transportadoras
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===== OCORRENCIAS =====
ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view ocorrencias" ON ocorrencias;
CREATE POLICY "Authenticated users can view ocorrencias" ON ocorrencias
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage ocorrencias" ON ocorrencias;
CREATE POLICY "Authenticated users can manage ocorrencias" ON ocorrencias
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ===== USER_LEVELS =====
ALTER TABLE user_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all levels" ON user_levels;
CREATE POLICY "Users can view all levels" ON user_levels
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own level" ON user_levels;
CREATE POLICY "Users can update own level" ON user_levels
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert levels" ON user_levels;
CREATE POLICY "System can insert levels" ON user_levels
  FOR INSERT TO authenticated WITH CHECK (true);

-- ===== ACHIEVEMENTS =====
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;
CREATE POLICY "Anyone can view achievements" ON achievements
  FOR SELECT TO authenticated USING (true);

-- ===== USER_ACHIEVEMENTS =====
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert achievements" ON user_achievements;
CREATE POLICY "System can insert achievements" ON user_achievements
  FOR INSERT TO authenticated WITH CHECK (true);

-- ===== PROFILES =====
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_coletas_status ON coletas(status);
CREATE INDEX IF NOT EXISTS idx_coletas_created_at ON coletas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entregas_status ON entregas(status);
CREATE INDEX IF NOT EXISTS idx_entregas_created_at ON entregas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_resolvida ON ocorrencias(resolvida);
CREATE INDEX IF NOT EXISTS idx_user_levels_total_xp ON user_levels(total_xp DESC);

-- Add comment
COMMENT ON TABLE clientes IS 'Customer records with delivery preferences';
COMMENT ON TABLE fornecedores IS 'Supplier records for pickups';
COMMENT ON TABLE coletas IS 'Pickup orders from suppliers';
COMMENT ON TABLE entregas IS 'Delivery orders to customers';
COMMENT ON TABLE ocorrencias IS 'Incident reports for pickups and deliveries';

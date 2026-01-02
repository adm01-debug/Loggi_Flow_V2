-- Tabela de gamificação do usuário
CREATE TABLE IF NOT EXISTS user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  level INT DEFAULT 1,
  xp INT DEFAULT 0,
  xp_to_next_level INT DEFAULT 100,
  coins INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  last_activity_date DATE,
  total_deliveries INT DEFAULT 0,
  total_collections INT DEFAULT 0,
  achievements TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de conquistas
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'trophy',
  xp_reward INT DEFAULT 0,
  coins_reward INT DEFAULT 0,
  requirement_type TEXT NOT NULL, -- 'deliveries', 'collections', 'streak', 'sla'
  requirement_value INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de resgates de recompensas
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id UUID,
  coins_spent INT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de recompensas da loja
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'gift',
  cost_coins INT NOT NULL,
  stock INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_gamification_user ON user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_xp ON user_gamification(xp DESC);
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON reward_redemptions(user_id);

-- RLS
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gamification" ON user_gamification FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own gamification" ON user_gamification FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Users can view own redemptions" ON reward_redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create redemptions" ON reward_redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view rewards" ON rewards FOR SELECT USING (true);

-- Inserir conquistas padrão
INSERT INTO achievements (name, description, icon, xp_reward, coins_reward, requirement_type, requirement_value) VALUES
('Primeira Entrega', 'Complete sua primeira entrega', 'package', 50, 10, 'deliveries', 1),
('Maratonista', 'Complete 10 entregas', 'zap', 100, 25, 'deliveries', 10),
('Profissional', 'Complete 50 entregas', 'award', 250, 50, 'deliveries', 50),
('Lenda', 'Complete 100 entregas', 'crown', 500, 100, 'deliveries', 100),
('Sequência de 7 dias', 'Mantenha uma sequência de 7 dias', 'flame', 150, 30, 'streak', 7),
('Sequência de 30 dias', 'Mantenha uma sequência de 30 dias', 'fire', 500, 100, 'streak', 30),
('SLA Master', 'Mantenha 95% de SLA', 'target', 200, 50, 'sla', 95)
ON CONFLICT DO NOTHING;

-- User levels and XP tracking
CREATE TABLE public.user_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_xp INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  coins INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Achievements definition table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Trophy',
  category TEXT NOT NULL DEFAULT 'general',
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  xp_reward INTEGER NOT NULL DEFAULT 50,
  coins_reward INTEGER NOT NULL DEFAULT 10,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User unlocked achievements
CREATE TABLE public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_levels
CREATE POLICY "Users can view their own level" ON public.user_levels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own level" ON public.user_levels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert user levels" ON public.user_levels FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
CREATE POLICY "Admins can manage achievements" ON public.achievements FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert user achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_levels_updated_at BEFORE UPDATE ON public.user_levels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default achievements based on logistics performance
INSERT INTO public.achievements (code, name, description, icon, category, rarity, xp_reward, coins_reward, requirement_type, requirement_value) VALUES
-- Delivery achievements
('first_delivery', 'Primeira Entrega', 'Complete sua primeira entrega', 'Truck', 'delivery', 'common', 50, 10, 'deliveries_completed', 1),
('delivery_rookie', 'Entregador Iniciante', 'Complete 10 entregas', 'Package', 'delivery', 'common', 100, 25, 'deliveries_completed', 10),
('delivery_pro', 'Entregador Profissional', 'Complete 50 entregas', 'PackageCheck', 'delivery', 'rare', 250, 50, 'deliveries_completed', 50),
('delivery_master', 'Mestre das Entregas', 'Complete 100 entregas', 'Trophy', 'delivery', 'epic', 500, 100, 'deliveries_completed', 100),
('delivery_legend', 'Lenda Logística', 'Complete 500 entregas', 'Crown', 'delivery', 'legendary', 1000, 250, 'deliveries_completed', 500),

-- Collection achievements
('first_collection', 'Primeira Coleta', 'Registre sua primeira coleta', 'PackagePlus', 'collection', 'common', 50, 10, 'collections_completed', 1),
('collector_rookie', 'Coletor Iniciante', 'Complete 10 coletas', 'Boxes', 'collection', 'common', 100, 25, 'collections_completed', 10),
('collector_pro', 'Coletor Experiente', 'Complete 50 coletas', 'Container', 'collection', 'rare', 250, 50, 'collections_completed', 50),
('collector_master', 'Mestre Coletor', 'Complete 100 coletas', 'Warehouse', 'collection', 'epic', 500, 100, 'collections_completed', 100),

-- Streak achievements
('streak_3', 'Consistência', 'Mantenha 3 dias consecutivos de atividade', 'Flame', 'streak', 'common', 75, 15, 'streak_days', 3),
('streak_7', 'Semana Perfeita', 'Mantenha 7 dias consecutivos de atividade', 'Zap', 'streak', 'rare', 150, 30, 'streak_days', 7),
('streak_30', 'Mês Dedicado', 'Mantenha 30 dias consecutivos de atividade', 'Star', 'streak', 'epic', 500, 100, 'streak_days', 30),
('streak_100', 'Imparável', 'Mantenha 100 dias consecutivos de atividade', 'Sparkles', 'streak', 'legendary', 1500, 300, 'streak_days', 100),

-- Performance achievements
('zero_incidents', 'Sem Incidentes', 'Complete 10 entregas sem ocorrências', 'ShieldCheck', 'performance', 'rare', 200, 40, 'deliveries_no_incidents', 10),
('speed_demon', 'Velocista', 'Complete 5 entregas antes do prazo', 'Timer', 'performance', 'rare', 200, 40, 'early_deliveries', 5),
('perfect_week', 'Semana Impecável', 'Complete uma semana com 100% de entregas no prazo', 'Award', 'performance', 'epic', 400, 80, 'perfect_weeks', 1),
('otif_champion', 'Campeão OTIF', 'Mantenha OTIF acima de 98% por 30 dias', 'Medal', 'performance', 'legendary', 1000, 200, 'otif_champion_days', 30),

-- Special achievements
('box_organizer', 'Organizador de BOX', 'Aloque produtos em 10 BOXes diferentes', 'LayoutGrid', 'special', 'common', 100, 20, 'boxes_used', 10),
('carrier_partner', 'Parceiro de Transportadora', 'Trabalhe com 5 transportadoras diferentes', 'Building2', 'special', 'rare', 200, 40, 'carriers_used', 5),
('night_owl', 'Coruja Noturna', 'Registre atividade após 22h', 'Moon', 'special', 'common', 50, 10, 'night_activities', 1),
('early_bird', 'Madrugador', 'Registre atividade antes das 7h', 'Sunrise', 'special', 'common', 50, 10, 'early_activities', 1);

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Level formula: Level = floor(sqrt(xp / 100)) + 1
  -- Level 1: 0-99 XP, Level 2: 100-399 XP, Level 3: 400-899 XP, etc.
  RETURN GREATEST(1, FLOOR(SQRT(xp / 100.0)) + 1);
END;
$$;

-- Function to get XP required for next level
CREATE OR REPLACE FUNCTION public.xp_for_level(lvl INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- XP required = (level - 1)^2 * 100
  RETURN (lvl - 1) * (lvl - 1) * 100;
END;
$$;

-- Trigger to auto-create user_levels on new user
CREATE OR REPLACE FUNCTION public.handle_new_user_levels()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_levels (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_levels
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_levels();
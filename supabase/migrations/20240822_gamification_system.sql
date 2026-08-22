-- 1. Enum para Tipos de Conquistas
DO $$ BEGIN
    CREATE TYPE public.achievement_tier AS ENUM ('bronze', 'silver', 'gold', 'platinum', 'diamond');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabela de Badges (Rank Badges)
CREATE TABLE IF NOT EXISTS public.rank_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    tier public.achievement_tier NOT NULL DEFAULT 'bronze',
    icon_url TEXT,
    xp_requirement INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT ON public.rank_badges TO authenticated;
GRANT ALL ON public.rank_badges TO service_role;

ALTER TABLE public.rank_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for authenticated" ON public.rank_badges
    FOR SELECT TO authenticated USING (true);

-- 3. Tabela de Prêmios (Task Gifts)
CREATE TABLE IF NOT EXISTS public.task_gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    coin_cost INTEGER NOT NULL DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT ON public.task_gifts TO authenticated;
GRANT ALL ON public.task_gifts TO service_role;

ALTER TABLE public.task_gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for authenticated" ON public.task_gifts
    FOR SELECT TO authenticated USING (true);

-- 4. Tabela de Conquistas dos Usuários
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_id UUID REFERENCES public.rank_badges(id) ON DELETE CASCADE NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, badge_id)
);

GRANT SELECT, INSERT ON public.user_achievements TO authenticated;
GRANT ALL ON public.user_achievements TO service_role;

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements" ON public.user_achievements
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 5. Função para premiar XP e moedas (Atomic)
CREATE OR REPLACE FUNCTION public.award_gamification_points(
    _user_id UUID,
    _xp_amount INTEGER,
    _coins_amount INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles
    SET 
        xp = xp + _xp_amount,
        coins = coins + _coins_amount,
        updated_at = now()
    WHERE id = _user_id;
END;
$$;

-- Garantir colunas no perfil se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='xp') THEN
        ALTER TABLE public.profiles ADD COLUMN xp INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='coins') THEN
        ALTER TABLE public.profiles ADD COLUMN coins INTEGER DEFAULT 0;
    END IF;
END $$;

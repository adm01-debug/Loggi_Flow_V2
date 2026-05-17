-- Adicionar suporte a WhatsApp nas preferências
ALTER TABLE public.user_notification_preferences 
ADD COLUMN IF NOT EXISTS notifications_whatsapp BOOLEAN DEFAULT true;

-- Criar tabela de Ranks (Patentes)
CREATE TABLE IF NOT EXISTS public.user_ranks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    min_level INTEGER NOT NULL UNIQUE,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    reward_multiplier NUMERIC DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS para user_ranks
ALTER TABLE public.user_ranks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ranks são visíveis por todos" ON public.user_ranks FOR SELECT USING (true);

-- Inserir Ranks Iniciais
INSERT INTO public.user_ranks (name, min_level, icon, color, reward_multiplier) VALUES
('Cadete Logístico', 1, 'Shield', '#94a3b8', 1.0),
('Especialista de Rota', 5, 'Navigation', '#3b82f6', 1.1),
('Mestre de Carga', 10, 'Package', '#8b5cf6', 1.25),
('Comandante Nexus', 20, 'Zap', '#f59e0b', 1.5),
('Lenda da Malha', 50, 'Trophy', '#ef4444', 2.0)
ON CONFLICT (min_level) DO NOTHING;

-- Vincular Rank ao User Level
ALTER TABLE public.user_levels 
ADD COLUMN IF NOT EXISTS rank_id UUID REFERENCES public.user_ranks(id);

-- Trigger para atualizar Rank automaticamente ao subir de nível
CREATE OR REPLACE FUNCTION public.update_user_rank()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.user_levels
    SET rank_id = (
        SELECT id FROM public.user_ranks 
        WHERE min_level <= NEW.level 
        ORDER BY min_level DESC 
        LIMIT 1
    )
    WHERE user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_level_up
AFTER UPDATE OF level ON public.user_levels
FOR EACH ROW
EXECUTE FUNCTION public.update_user_rank();

-- Inicializar ranks para usuários existentes
UPDATE public.user_levels ul
SET rank_id = (
    SELECT id FROM public.user_ranks 
    WHERE min_level <= ul.level 
    ORDER BY min_level DESC 
    LIMIT 1
)
WHERE rank_id IS NULL;

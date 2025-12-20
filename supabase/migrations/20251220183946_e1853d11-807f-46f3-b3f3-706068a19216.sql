-- Criar tabela para itens da loja de recompensas
CREATE TABLE public.reward_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  coins_cost INTEGER NOT NULL DEFAULT 100,
  category TEXT NOT NULL DEFAULT 'geral',
  icon TEXT NOT NULL DEFAULT 'Gift',
  rarity TEXT NOT NULL DEFAULT 'common',
  available BOOLEAN NOT NULL DEFAULT true,
  stock INTEGER DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para compras de recompensas
CREATE TABLE public.reward_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_item_id UUID NOT NULL REFERENCES public.reward_items(id) ON DELETE CASCADE,
  coins_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.reward_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_purchases ENABLE ROW LEVEL SECURITY;

-- Políticas para reward_items (todos podem ver)
CREATE POLICY "Todos podem ver itens da loja" ON public.reward_items FOR SELECT USING (true);
CREATE POLICY "Admins podem gerenciar itens" ON public.reward_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Políticas para reward_purchases (usuários só veem suas compras)
CREATE POLICY "Usuários podem ver suas compras" ON public.reward_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem criar compras" ON public.reward_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins podem ver todas compras" ON public.reward_purchases FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins podem atualizar compras" ON public.reward_purchases FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Inserir itens iniciais na loja
INSERT INTO public.reward_items (name, description, coins_cost, category, icon, rarity) VALUES
('Dia de Folga Extra', 'Ganhe um dia de folga extra para usar quando quiser', 500, 'beneficio', 'Calendar', 'legendary'),
('Vale Almoço', 'Vale-refeição de R$50 para usar em restaurantes parceiros', 150, 'beneficio', 'UtensilsCrossed', 'rare'),
('Camiseta Exclusiva', 'Camiseta personalizada da equipe de logística', 200, 'item', 'Shirt', 'rare'),
('Badge VIP', 'Badge dourada exclusiva no perfil por 30 dias', 100, 'virtual', 'Award', 'common'),
('Prioridade no Ranking', 'Destaque especial no ranking por 7 dias', 75, 'virtual', 'Crown', 'common'),
('Vale Combustível', 'Vale-combustível de R$100', 300, 'beneficio', 'Fuel', 'epic'),
('Mousepad Personalizado', 'Mousepad com seu nome e conquistas', 80, 'item', 'Mouse', 'common'),
('Caneca Térmica', 'Caneca térmica premium com logo da empresa', 120, 'item', 'Coffee', 'rare');
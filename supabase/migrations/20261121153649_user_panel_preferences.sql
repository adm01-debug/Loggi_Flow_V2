-- Metas de SLA por usuário (PainelSLA).
-- Substitui o armazenamento em localStorage por persistência real no banco,
-- igual ao padrão já usado por user_notification_preferences / saved_filters.
-- Nota: não há trigger de criação automática; o hook cria a linha no primeiro save.
CREATE TABLE IF NOT EXISTS public.user_panel_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sla_critico_horas NUMERIC NOT NULL DEFAULT 4,
  sla_alto_horas NUMERIC NOT NULL DEFAULT 12,
  sla_medio_horas NUMERIC NOT NULL DEFAULT 24,
  sla_meta_on_time_pct NUMERIC NOT NULL DEFAULT 95,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_panel_preferences_user_id_key UNIQUE (user_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_panel_preferences_user_id
  ON public.user_panel_preferences(user_id);

-- RLS
ALTER TABLE public.user_panel_preferences ENABLE ROW LEVEL SECURITY;

-- Cada usuário só vê, cria e edita a própria linha.
CREATE POLICY "Users can view own panel preferences"
  ON public.user_panel_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own panel preferences"
  ON public.user_panel_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own panel preferences"
  ON public.user_panel_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
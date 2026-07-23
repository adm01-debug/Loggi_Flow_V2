
CREATE TABLE public.mitigation_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('clima','transportadora','distancia','feriado','demanda','endereco','documentacao','outros')),
  headline TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('alta','media','baixa')),
  focus_carrier TEXT,
  impact_score INTEGER NOT NULL DEFAULT 0 CHECK (impact_score BETWEEN 0 AND 100),
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'planejada' CHECK (status IN ('planejada','em_execucao','concluida','cancelada')),
  otif_before NUMERIC(5,2),
  otif_after NUMERIC(5,2),
  otif_delta NUMERIC(6,2) GENERATED ALWAYS AS (COALESCE(otif_after,0) - COALESCE(otif_before,0)) STORED,
  notes TEXT,
  executed_at TIMESTAMPTZ,
  measured_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mitigation_actions_user ON public.mitigation_actions(user_id);
CREATE INDEX idx_mitigation_actions_category ON public.mitigation_actions(category);
CREATE INDEX idx_mitigation_actions_status ON public.mitigation_actions(status);
CREATE INDEX idx_mitigation_actions_executed_at ON public.mitigation_actions(executed_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mitigation_actions TO authenticated;
GRANT ALL ON public.mitigation_actions TO service_role;

ALTER TABLE public.mitigation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own mitigations"
  ON public.mitigation_actions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_mitigation_actions_updated_at
  BEFORE UPDATE ON public.mitigation_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

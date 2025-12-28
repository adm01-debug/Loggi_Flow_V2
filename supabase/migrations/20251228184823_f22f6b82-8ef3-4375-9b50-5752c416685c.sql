-- Tabela para armazenar regras de negócio configuráveis
CREATE TABLE public.business_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL, -- 'coleta', 'entrega', 'ocorrencia'
  trigger_event TEXT NOT NULL, -- 'on_create', 'on_update', 'on_status_change'
  conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_rules ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Authenticated users can view business rules"
  ON public.business_rules FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage business rules"
  ON public.business_rules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Tabela para log de execução de regras
CREATE TABLE public.rule_execution_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID REFERENCES public.business_rules(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  trigger_event TEXT NOT NULL,
  conditions_met BOOLEAN NOT NULL,
  actions_executed JSONB,
  execution_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rule_execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view rule logs"
  ON public.rule_execution_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert rule logs"
  ON public.rule_execution_logs FOR INSERT
  WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_business_rules_updated_at
  BEFORE UPDATE ON public.business_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
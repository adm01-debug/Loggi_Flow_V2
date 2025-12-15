-- Create cost alerts configuration table
CREATE TABLE public.alertas_custo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('transportadora', 'rota', 'global')),
  transportadora_id UUID REFERENCES public.transportadoras(id) ON DELETE CASCADE,
  estado_destino TEXT,
  limite_mensal NUMERIC NOT NULL,
  limite_por_entrega NUMERIC,
  ativo BOOLEAN NOT NULL DEFAULT true,
  notificar_percentual INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.alertas_custo ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to manage alerts
CREATE POLICY "Allow all access to alertas_custo" 
  ON public.alertas_custo 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_alertas_custo_updated_at
  BEFORE UPDATE ON public.alertas_custo
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_alertas_custo_tipo ON public.alertas_custo(tipo);
CREATE INDEX idx_alertas_custo_transportadora ON public.alertas_custo(transportadora_id);
CREATE INDEX idx_alertas_custo_estado ON public.alertas_custo(estado_destino);

-- Create notifications table for cost alerts
CREATE TABLE public.notificacoes_custo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alerta_id UUID REFERENCES public.alertas_custo(id) ON DELETE CASCADE,
  tipo_notificacao TEXT NOT NULL CHECK (tipo_notificacao IN ('warning', 'critical', 'exceeded')),
  mensagem TEXT NOT NULL,
  valor_atual NUMERIC NOT NULL,
  limite NUMERIC NOT NULL,
  percentual_atingido NUMERIC NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notificacoes_custo ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to manage notifications
CREATE POLICY "Allow all access to notificacoes_custo" 
  ON public.notificacoes_custo 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notificacoes_custo;
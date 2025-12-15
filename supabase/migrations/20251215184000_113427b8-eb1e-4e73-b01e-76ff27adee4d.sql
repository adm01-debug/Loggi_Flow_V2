-- Create table for driver tracking history
CREATE TABLE public.rastreamento_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  coleta_id UUID REFERENCES public.coletas(id) ON DELETE SET NULL,
  lalamove_order_id TEXT NOT NULL,
  driver_id TEXT,
  driver_name TEXT,
  driver_phone TEXT,
  driver_plate TEXT,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  order_status TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_rastreamento_historico_order ON public.rastreamento_historico(lalamove_order_id);
CREATE INDEX idx_rastreamento_historico_coleta ON public.rastreamento_historico(coleta_id);
CREATE INDEX idx_rastreamento_historico_recorded_at ON public.rastreamento_historico(recorded_at);

-- Enable RLS
ALTER TABLE public.rastreamento_historico ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view and insert tracking data
CREATE POLICY "Authenticated users can view tracking history"
ON public.rastreamento_historico
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert tracking data"
ON public.rastreamento_historico
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Create table for tracking alerts history
CREATE TABLE public.rastreamento_alertas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lalamove_order_id TEXT NOT NULL,
  coleta_id UUID REFERENCES public.coletas(id) ON DELETE SET NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for alerts
CREATE INDEX idx_rastreamento_alertas_order ON public.rastreamento_alertas(lalamove_order_id);
CREATE INDEX idx_rastreamento_alertas_coleta ON public.rastreamento_alertas(coleta_id);
CREATE INDEX idx_rastreamento_alertas_created_at ON public.rastreamento_alertas(created_at);

-- Enable RLS
ALTER TABLE public.rastreamento_alertas ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage alerts
CREATE POLICY "Authenticated users can view tracking alerts"
ON public.rastreamento_alertas
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert tracking alerts"
ON public.rastreamento_alertas
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update tracking alerts"
ON public.rastreamento_alertas
FOR UPDATE
USING (auth.uid() IS NOT NULL);
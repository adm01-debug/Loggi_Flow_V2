-- Drop existing table (it's empty, checked with row count)
DROP TABLE IF EXISTS public.rastreamento_historico CASCADE;

-- Create partitioned table
CREATE TABLE public.rastreamento_historico (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    coleta_id UUID REFERENCES public.coletas(id),
    lalamove_order_id TEXT NOT NULL,
    driver_id TEXT,
    driver_name TEXT,
    driver_phone TEXT,
    driver_plate TEXT,
    latitude NUMERIC NOT NULL,
    longitude NUMERIC NOT NULL,
    order_status TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Create initial partitions (for 2026)
CREATE TABLE public.rastreamento_historico_y2026m01 PARTITION OF public.rastreamento_historico
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE public.rastreamento_historico_y2026m02 PARTITION OF public.rastreamento_historico
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE public.rastreamento_historico_y2026m03 PARTITION OF public.rastreamento_historico
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE public.rastreamento_historico_y2026m04 PARTITION OF public.rastreamento_historico
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE public.rastreamento_historico_y2026m05 PARTITION OF public.rastreamento_historico
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE public.rastreamento_historico_y2026m06 PARTITION OF public.rastreamento_historico
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

-- Enable RLS
ALTER TABLE public.rastreamento_historico ENABLE ROW LEVEL SECURITY;

-- Re-create policies
CREATE POLICY "Admins can view tracking history" 
ON public.rastreamento_historico 
FOR SELECT 
TO authenticated 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can insert tracking data" 
ON public.rastreamento_historico 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_rastreamento_lalamove_order ON public.rastreamento_historico(lalamove_order_id);
CREATE INDEX idx_rastreamento_coleta ON public.rastreamento_historico(coleta_id);

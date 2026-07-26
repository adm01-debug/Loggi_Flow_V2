CREATE TABLE public.rte_gateway_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gateway TEXT NOT NULL,
  online BOOLEAN NOT NULL,
  http_status INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT rte_gateway_health_latency_positive CHECK (latency_ms >= 0),
  CONSTRAINT rte_gateway_health_status_range CHECK (http_status >= 0 AND http_status < 600)
);

GRANT SELECT ON public.rte_gateway_health TO authenticated;
GRANT ALL ON public.rte_gateway_health TO service_role;

ALTER TABLE public.rte_gateway_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read gateway health"
  ON public.rte_gateway_health FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can delete gateway health history"
  ON public.rte_gateway_health FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_rte_gateway_health_checked_at ON public.rte_gateway_health (checked_at DESC);
CREATE INDEX idx_rte_gateway_health_gateway_checked ON public.rte_gateway_health (gateway, checked_at DESC);
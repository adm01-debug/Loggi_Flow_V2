CREATE TABLE public.rte_slo_targets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gateway text NOT NULL UNIQUE,
  uptime_target_pct numeric(5,2) NOT NULL DEFAULT 99 CHECK (uptime_target_pct >= 50 AND uptime_target_pct <= 100),
  latency_p95_budget_ms integer NOT NULL DEFAULT 2000 CHECK (latency_p95_budget_ms >= 50 AND latency_p95_budget_ms <= 120000),
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.rte_slo_targets TO authenticated;
GRANT ALL ON public.rte_slo_targets TO service_role;

ALTER TABLE public.rte_slo_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver metas de SLO"
  ON public.rte_slo_targets FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins podem inserir metas de SLO"
  ON public.rte_slo_targets FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar metas de SLO"
  ON public.rte_slo_targets FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem remover metas de SLO"
  ON public.rte_slo_targets FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_rte_slo_targets_updated_at
  BEFORE UPDATE ON public.rte_slo_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
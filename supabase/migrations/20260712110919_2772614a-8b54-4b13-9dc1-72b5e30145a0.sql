
-- ================================
-- SPRINT 23: Move MVs to private schema
-- ================================

CREATE SCHEMA IF NOT EXISTS internal;
REVOKE ALL ON SCHEMA internal FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA internal TO service_role;

-- Recreate MVs in internal schema
DROP MATERIALIZED VIEW IF EXISTS public.mv_dashboard_metrics CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.mv_carrier_performance CASCADE;

CREATE MATERIALIZED VIEW internal.mv_dashboard_metrics AS
SELECT
  1 AS singleton,
  (SELECT count(*) FROM public.coletas) AS total_coletas,
  (SELECT count(*) FROM public.coletas WHERE status IN ('aguardando_liberacao','solicitada')) AS coletas_pendentes,
  (SELECT count(*) FROM public.coletas WHERE status = 'em_transito') AS coletas_em_transito,
  (SELECT count(*) FROM public.coletas WHERE status = 'finalizada') AS coletas_finalizadas,
  (SELECT count(*) FROM public.coletas WHERE divergencia_percentual > 5) AS coletas_com_divergencia,
  (SELECT COALESCE(sum(qtd_volumes),0) FROM public.coletas) AS total_volume,
  (SELECT count(*) FROM public.entregas) AS total_entregas,
  (SELECT count(*) FROM public.entregas WHERE status IN ('aguardando_producao','pronto_despacho','cotacao_frete','nf_emitida')) AS entregas_pendentes,
  (SELECT count(*) FROM public.entregas WHERE status IN ('despachado','em_transito','saiu_entrega')) AS entregas_em_transito,
  (SELECT count(*) FROM public.entregas WHERE status IN ('entregue','finalizado')) AS entregas_finalizadas,
  (SELECT count(*) FROM public.entregas WHERE status = 'ocorrencia') AS entregas_com_ocorrencia,
  (SELECT COALESCE(sum(valor_frete),0) FROM public.entregas) AS valor_total_frete,
  (SELECT CASE WHEN count(*) > 0
     THEN (count(*) FILTER (WHERE data_entrega_efetiva <= previsao_entrega AND status <> 'ocorrencia'))::numeric / count(*)::numeric * 100
     ELSE 100 END FROM public.entregas) AS otif_rate,
  now() AS last_refresh;

CREATE UNIQUE INDEX ON internal.mv_dashboard_metrics(singleton);

CREATE MATERIALIZED VIEW internal.mv_carrier_performance AS
SELECT
  t.id AS transportadora_id,
  t.nome_fantasia,
  count(e.id) AS total_entregas,
  count(e.id) FILTER (WHERE e.data_entrega_efetiva <= e.previsao_entrega) AS entregas_no_prazo,
  CASE WHEN count(e.id) > 0
    THEN (count(e.id) FILTER (WHERE e.data_entrega_efetiva <= e.previsao_entrega))::numeric / count(e.id)::numeric * 100
    ELSE 0 END AS otif_percent,
  COALESCE(sum(e.valor_frete),0) AS valor_total_frete,
  now() AS last_refresh
FROM public.transportadoras t
LEFT JOIN public.entregas e ON e.transportadora_id = t.id AND e.status IN ('entregue','finalizado')
GROUP BY t.id, t.nome_fantasia;

CREATE UNIQUE INDEX ON internal.mv_carrier_performance(transportadora_id);
CREATE INDEX ON internal.mv_carrier_performance(otif_percent DESC);

-- Update refresh function
CREATE OR REPLACE FUNCTION public.refresh_dashboard_views()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = internal, public
AS $$
DECLARE
  v_start timestamptz := clock_timestamp();
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY internal.mv_dashboard_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY internal.mv_carrier_performance;
  RETURN jsonb_build_object(
    'status','ok',
    'refreshed_at', now(),
    'duration_ms', EXTRACT(MILLISECOND FROM (clock_timestamp() - v_start))
  );
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_dashboard_views() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_dashboard_views() TO service_role;

-- Safe wrapper RPCs for authenticated read
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics_fast()
RETURNS internal.mv_dashboard_metrics
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = internal, public
AS $$ SELECT * FROM internal.mv_dashboard_metrics LIMIT 1; $$;

REVOKE ALL ON FUNCTION public.get_dashboard_metrics_fast() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics_fast() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_carrier_performance_fast()
RETURNS SETOF internal.mv_carrier_performance
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = internal, public
AS $$ SELECT * FROM internal.mv_carrier_performance ORDER BY otif_percent DESC; $$;

REVOKE ALL ON FUNCTION public.get_carrier_performance_fast() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_carrier_performance_fast() TO authenticated, service_role;

-- Initial populate
REFRESH MATERIALIZED VIEW internal.mv_dashboard_metrics;
REFRESH MATERIALIZED VIEW internal.mv_carrier_performance;

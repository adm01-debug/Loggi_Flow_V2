
ALTER TABLE public.delay_predictions_history
  ADD COLUMN IF NOT EXISTS transportadora text;

CREATE INDEX IF NOT EXISTS idx_delay_pred_hist_transp
  ON public.delay_predictions_history (transportadora, predicted_at DESC);

UPDATE public.delay_predictions_history h
SET transportadora = COALESCE(t.nome_fantasia, t.razao_social)
FROM public.entregas e
JOIN public.transportadoras t ON t.id = e.transportadora_id
WHERE h.entity_type = 'entrega'
  AND h.entity_id = e.id
  AND h.transportadora IS NULL;

CREATE OR REPLACE VIEW public.v_prediction_accuracy_by_carrier
WITH (security_invoker = true) AS
SELECT
  COALESCE(transportadora, 'Sem transportadora') AS transportadora,
  risco,
  COUNT(*)                                        AS total_predicoes,
  COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL) AS total_confirmadas,
  COUNT(*) FILTER (WHERE was_accurate = true)      AS total_acertos,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE was_accurate = true)
    / NULLIF(COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL), 0),
    1
  ) AS acuracia_percentual,
  ROUND(AVG(ABS(actual_delay_hours - horas_estimadas_atraso))
          FILTER (WHERE confirmed_at IS NOT NULL)::numeric, 2)
    AS desvio_medio_horas,
  MAX(predicted_at) AS ultima_predicao
FROM public.delay_predictions_history
WHERE predicted_at > now() - interval '30 days'
GROUP BY 1, 2;

GRANT SELECT ON public.v_prediction_accuracy_by_carrier TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_calibrated_tolerance(_transportadora text)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    ROUND(AVG(ABS(actual_delay_hours - horas_estimadas_atraso))::numeric, 2),
    2.0
  )
  FROM public.delay_predictions_history
  WHERE confirmed_at IS NOT NULL
    AND transportadora = _transportadora
    AND predicted_at > now() - interval '60 days'
$$;

REVOKE EXECUTE ON FUNCTION public.get_calibrated_tolerance(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_calibrated_tolerance(text) TO authenticated, service_role;


CREATE OR REPLACE VIEW public.v_prediction_accuracy_daily_carrier AS
SELECT
  DATE_TRUNC('day', predicted_at)::date AS dia,
  COALESCE(NULLIF(transportadora, ''), 'Sem transportadora') AS transportadora,
  COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL) AS total_confirmadas,
  COUNT(*) FILTER (WHERE was_accurate = true) AS acertos,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE was_accurate = true)
    / NULLIF(COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL), 0),
    2
  ) AS acuracia_pct
FROM public.delay_predictions_history
WHERE predicted_at > now() - interval '30 days'
GROUP BY 1, 2
ORDER BY 1, 2;

ALTER VIEW public.v_prediction_accuracy_daily_carrier SET (security_invoker = true);
GRANT SELECT ON public.v_prediction_accuracy_daily_carrier TO authenticated, service_role;


DROP VIEW IF EXISTS public.v_prediction_accuracy;
CREATE VIEW public.v_prediction_accuracy
WITH (security_invoker = true) AS
SELECT
  date_trunc('day', predicted_at)::date AS dia,
  risco,
  COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL) AS total_confirmadas,
  COUNT(*) FILTER (WHERE was_accurate = true) AS total_acertos,
  ROUND(
    (COUNT(*) FILTER (WHERE was_accurate = true)::numeric
     / NULLIF(COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL), 0)) * 100,
    2
  ) AS acuracia_percentual,
  COUNT(*) AS total_predicoes
FROM public.delay_predictions_history
GROUP BY 1, 2;

GRANT SELECT ON public.v_prediction_accuracy TO authenticated;

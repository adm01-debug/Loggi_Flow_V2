CREATE OR REPLACE FUNCTION public.count_prediction_breach_days(_target numeric, _carrier text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH daily AS (
    SELECT
      date_trunc('day', created_at)::date AS d,
      AVG(CASE WHEN was_accurate THEN 100.0 ELSE 0.0 END) AS acc_pct
    FROM public.delay_predictions_history
    WHERE was_accurate IS NOT NULL
      AND created_at >= now() - INTERVAL '30 days'
      AND (_carrier IS NULL OR transportadora = _carrier)
    GROUP BY 1
    ORDER BY 1 DESC
  ), streak AS (
    SELECT d, acc_pct,
      ROW_NUMBER() OVER (ORDER BY d DESC) AS rn,
      (acc_pct < _target) AS is_breach
    FROM daily
  )
  SELECT COALESCE(
    (SELECT MIN(rn) - 1 FROM streak WHERE NOT is_breach),
    (SELECT COUNT(*)::int FROM streak)
  );
$function$

CREATE OR REPLACE FUNCTION public.count_prediction_breach_days_bulk(_pairs jsonb)
 RETURNS TABLE(carrier text, target numeric, breach_days integer)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  WITH pares AS (
    SELECT
      NULLIF(p.value->>'carrier', '') AS carrier,
      (p.value->>'target')::numeric AS target,
      p.ord
    FROM jsonb_array_elements(COALESCE(_pairs, '[]'::jsonb)) WITH ORDINALITY AS p(value, ord)
  ), diario AS (
    SELECT
      date_trunc('day', h.created_at)::date AS d,
      h.transportadora AS carrier,
      AVG(CASE WHEN h.was_accurate THEN 100.0 ELSE 0.0 END) AS acc_pct,
      GROUPING(h.transportadora) AS grupo_todos
    FROM public.delay_predictions_history h
    WHERE h.was_accurate IS NOT NULL
      AND h.created_at >= now() - INTERVAL '30 days'
    GROUP BY GROUPING SETS (
      (date_trunc('day', h.created_at)::date, h.transportadora),
      (date_trunc('day', h.created_at)::date)
    )
  ), serie AS (
    SELECT
      pr.ord,
      dd.d,
      dd.acc_pct,
      ROW_NUMBER() OVER (PARTITION BY pr.ord ORDER BY dd.d DESC) AS rn,
      (dd.acc_pct < pr.target) AS is_breach
    FROM pares pr
    JOIN diario dd
      ON (pr.carrier IS NULL AND dd.grupo_todos = 1)
      OR (pr.carrier IS NOT NULL AND dd.grupo_todos = 0 AND dd.carrier = pr.carrier)
  )
  SELECT
    pr.carrier,
    pr.target,
    COALESCE(
      (SELECT MIN(s.rn) - 1 FROM serie s WHERE s.ord = pr.ord AND NOT s.is_breach),
      (SELECT COUNT(*)::int FROM serie s WHERE s.ord = pr.ord)
    ) AS breach_days
  FROM pares pr
  ORDER BY pr.ord;
$function$

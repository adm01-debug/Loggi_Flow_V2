CREATE OR REPLACE FUNCTION public.detect_health_score_regression(p_threshold numeric DEFAULT 10)
 RETURNS TABLE(current_score numeric, previous_score numeric, delta numeric, regression_detected boolean, current_at timestamp with time zone, previous_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_curr record;
  v_prev record;
  v_delta numeric;
BEGIN
  SELECT overall_score, captured_at INTO v_curr
    FROM public.db_health_score_history
   ORDER BY captured_at DESC LIMIT 1;

  SELECT overall_score, captured_at INTO v_prev
    FROM public.db_health_score_history
   WHERE captured_at <= (v_curr.captured_at - interval '20 hours')
   ORDER BY captured_at DESC LIMIT 1;

  IF v_curr IS NULL OR v_prev IS NULL THEN
    RETURN;
  END IF;

  v_delta := v_curr.overall_score - v_prev.overall_score;
  RETURN QUERY SELECT
    v_curr.overall_score,
    v_prev.overall_score,
    ROUND(v_delta, 2),
    (v_delta <= -p_threshold),
    v_curr.captured_at,
    v_prev.captured_at;
END; $function$

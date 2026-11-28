CREATE OR REPLACE FUNCTION public.get_health_score_history_fast(p_days integer DEFAULT 30)
 RETURNS TABLE(captured_at timestamp with time zone, overall_score numeric, grade text, slo_score numeric, anomaly_score numeric, mttr_score numeric, capacity_score numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;
  RETURN QUERY
    SELECT h.captured_at, h.overall_score, h.grade,
           h.slo_score, h.anomaly_score, h.mttr_score, h.capacity_score
      FROM public.db_health_score_history h
     WHERE h.captured_at >= now() - (p_days || ' days')::interval
     ORDER BY h.captured_at ASC;
END; $function$

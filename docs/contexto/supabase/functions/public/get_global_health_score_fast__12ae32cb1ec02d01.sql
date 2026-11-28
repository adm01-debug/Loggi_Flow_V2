CREATE OR REPLACE FUNCTION public.get_global_health_score_fast()
 RETURNS TABLE(overall_score numeric, grade text, slo_score numeric, anomaly_score numeric, mttr_score numeric, capacity_score numeric, computed_at timestamp with time zone, details jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_slo numeric := 100;
  v_anom numeric := 100;
  v_mttr numeric := 100;
  v_cap numeric := 100;
  v_overall numeric;
  v_crit_anom int := 0;
  v_warn_anom int := 0;
  v_crit_cap int := 0;
  v_warn_cap int := 0;
  v_avg_mttr numeric := 0;
  v_resolution_rate numeric := 100;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;

  -- 1) SLO score: média dos últimos 7 dias
  SELECT COALESCE(AVG(overall_slo_pct), 100)
    INTO v_slo
    FROM public.db_slo_daily
   WHERE day >= (current_date - 7);

  -- 2) Anomaly score: penaliza críticas (-20) e warnings (-5)
  SELECT
    COUNT(*) FILTER (WHERE severity = 'critical'),
    COUNT(*) FILTER (WHERE severity = 'warning')
    INTO v_crit_anom, v_warn_anom
  FROM public.get_health_anomalies_fast();
  v_anom := GREATEST(0, 100 - (v_crit_anom * 20) - (v_warn_anom * 5));

  -- 3) MTTR score: taxa média de resolução (últimos 30d) - bônus/malus por rapidez
  SELECT
    COALESCE(AVG(resolution_rate_pct), 100),
    COALESCE(AVG(mttr_hours), 0)
    INTO v_resolution_rate, v_avg_mttr
  FROM public.get_remediation_mttr_fast();
  -- penaliza MTTR > 48h
  v_mttr := GREATEST(0, LEAST(100,
    v_resolution_rate - GREATEST(0, (v_avg_mttr - 48)) * 0.5
  ));

  -- 4) Capacity score: penaliza previsões críticas/warning
  SELECT
    COUNT(*) FILTER (WHERE severity = 'critical'),
    COUNT(*) FILTER (WHERE severity = 'warning')
    INTO v_crit_cap, v_warn_cap
  FROM public.get_capacity_forecast_fast(168);
  v_cap := GREATEST(0, 100 - (v_crit_cap * 25) - (v_warn_cap * 10));

  -- Overall: média ponderada (SLO 40%, Anom 25%, MTTR 20%, Cap 15%)
  v_overall := ROUND(
    (v_slo * 0.40 + v_anom * 0.25 + v_mttr * 0.20 + v_cap * 0.15)::numeric, 2
  );

  RETURN QUERY SELECT
    v_overall,
    CASE
      WHEN v_overall >= 95 THEN 'A+'
      WHEN v_overall >= 90 THEN 'A'
      WHEN v_overall >= 80 THEN 'B'
      WHEN v_overall >= 70 THEN 'C'
      WHEN v_overall >= 60 THEN 'D'
      ELSE 'F'
    END,
    ROUND(v_slo::numeric, 2),
    ROUND(v_anom::numeric, 2),
    ROUND(v_mttr::numeric, 2),
    ROUND(v_cap::numeric, 2),
    now(),
    jsonb_build_object(
      'critical_anomalies', v_crit_anom,
      'warning_anomalies', v_warn_anom,
      'critical_capacity', v_crit_cap,
      'warning_capacity', v_warn_cap,
      'avg_mttr_hours', ROUND(v_avg_mttr::numeric, 2),
      'resolution_rate_pct', ROUND(v_resolution_rate::numeric, 2),
      'weights', jsonb_build_object('slo', 0.40, 'anomaly', 0.25, 'mttr', 0.20, 'capacity', 0.15)
    );
END;
$function$

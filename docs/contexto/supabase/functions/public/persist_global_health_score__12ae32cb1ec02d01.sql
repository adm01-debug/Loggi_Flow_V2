CREATE OR REPLACE FUNCTION public.persist_global_health_score()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_slo numeric := 100;
  v_anom numeric := 100;
  v_mttr numeric := 100;
  v_cap numeric := 100;
  v_overall numeric;
  v_grade text;
  v_crit_anom int := 0;
  v_warn_anom int := 0;
  v_crit_cap int := 0;
  v_warn_cap int := 0;
  v_avg_mttr numeric := 0;
  v_resolution_rate numeric := 100;
  v_id uuid;
BEGIN
  SELECT COALESCE(AVG(overall_slo_pct), 100) INTO v_slo
    FROM public.db_slo_daily WHERE day >= (current_date - 7);

  -- Anomalias (reproduz lógica inline sem RLS admin)
  WITH stats AS (
    SELECT avg(active_connections)::numeric AS mc, stddev_samp(active_connections)::numeric AS sc,
           avg(cache_hit_ratio)::numeric AS mca, stddev_samp(cache_hit_ratio)::numeric AS sca,
           avg(deadlocks)::numeric AS md, stddev_samp(deadlocks)::numeric AS sd
      FROM public.db_health_snapshots
     WHERE created_at > now() - interval '7 days'
       AND created_at < now() - interval '1 hour'
  ),
  latest AS (
    SELECT active_connections, cache_hit_ratio, deadlocks
      FROM public.db_health_snapshots ORDER BY created_at DESC LIMIT 1
  )
  SELECT
    COUNT(*) FILTER (WHERE sev='critical'),
    COUNT(*) FILTER (WHERE sev='warning')
    INTO v_crit_anom, v_warn_anom
  FROM (
    SELECT CASE WHEN s.sc>0 AND abs((l.active_connections-s.mc)/s.sc)>=3 THEN 'critical'
                WHEN s.sc>0 AND abs((l.active_connections-s.mc)/s.sc)>=2 THEN 'warning' ELSE 'ok' END AS sev
      FROM latest l, stats s
    UNION ALL
    SELECT CASE WHEN s.sca>0 AND ((l.cache_hit_ratio-s.mca)/s.sca)<=-3 THEN 'critical'
                WHEN s.sca>0 AND ((l.cache_hit_ratio-s.mca)/s.sca)<=-2 THEN 'warning' ELSE 'ok' END
      FROM latest l, stats s
    UNION ALL
    SELECT CASE WHEN s.sd>0 AND ((l.deadlocks-s.md)/s.sd)>=3 THEN 'critical'
                WHEN s.sd>0 AND ((l.deadlocks-s.md)/s.sd)>=2 THEN 'warning' ELSE 'ok' END
      FROM latest l, stats s
  ) x;
  v_anom := GREATEST(0, 100 - (v_crit_anom*20) - (v_warn_anom*5));

  -- MTTR
  SELECT
    COALESCE(AVG(CASE WHEN status='resolved' THEN EXTRACT(EPOCH FROM (resolved_at-applied_at))/3600.0 END), 0),
    COALESCE(100.0 * COUNT(*) FILTER (WHERE status='resolved')::numeric / NULLIF(COUNT(*),0), 100)
    INTO v_avg_mttr, v_resolution_rate
  FROM public.remediation_actions
  WHERE created_at >= now() - interval '30 days';
  v_mttr := GREATEST(0, LEAST(100, v_resolution_rate - GREATEST(0,(v_avg_mttr-48))*0.5));

  -- Capacidade (simplificado: contagem de forecasts críticos via db_health_snapshots)
  -- usa mesma heurística: conexões > 80 = crit, > 60 = warn
  SELECT
    COUNT(*) FILTER (WHERE active_connections >= 80),
    COUNT(*) FILTER (WHERE active_connections >= 60 AND active_connections < 80)
    INTO v_crit_cap, v_warn_cap
  FROM (
    SELECT active_connections FROM public.db_health_snapshots
     ORDER BY created_at DESC LIMIT 1
  ) t;
  v_cap := GREATEST(0, 100 - (v_crit_cap*25) - (v_warn_cap*10));

  v_overall := ROUND((v_slo*0.40 + v_anom*0.25 + v_mttr*0.20 + v_cap*0.15)::numeric, 2);
  v_grade := CASE
    WHEN v_overall>=95 THEN 'A+' WHEN v_overall>=90 THEN 'A'
    WHEN v_overall>=80 THEN 'B' WHEN v_overall>=70 THEN 'C'
    WHEN v_overall>=60 THEN 'D' ELSE 'F' END;

  INSERT INTO public.db_health_score_history (
    overall_score, grade, slo_score, anomaly_score, mttr_score, capacity_score, details
  ) VALUES (
    v_overall, v_grade,
    ROUND(v_slo::numeric,2), ROUND(v_anom::numeric,2),
    ROUND(v_mttr::numeric,2), ROUND(v_cap::numeric,2),
    jsonb_build_object(
      'critical_anomalies', v_crit_anom,
      'warning_anomalies', v_warn_anom,
      'avg_mttr_hours', ROUND(v_avg_mttr::numeric,2),
      'resolution_rate_pct', ROUND(v_resolution_rate::numeric,2)
    )
  ) RETURNING id INTO v_id;
  RETURN v_id;
END; $function$

CREATE OR REPLACE FUNCTION public.rte_rollup_slo_daily(target_day date DEFAULT ((now() AT TIME ZONE 'utc'::text))::date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  affected integer := 0;
  v_uptime_target numeric := 99;
  v_latency_budget integer := 3000;
BEGIN
  SELECT COALESCE(t.uptime_target_pct, 99), COALESCE(t.latency_p95_budget_ms, 3000)
    INTO v_uptime_target, v_latency_budget
  FROM public.rte_slo_targets t
  WHERE t.gateway = '__global__'
  LIMIT 1;

  v_uptime_target := COALESCE(v_uptime_target, 99);
  v_latency_budget := COALESCE(v_latency_budget, 3000);

  WITH agg AS (
    SELECT
      (h.checked_at AT TIME ZONE 'utc')::date AS day,
      h.gateway,
      COUNT(*)::int AS checks,
      COUNT(*) FILTER (WHERE NOT h.online)::int AS failures,
      ROUND((COUNT(*) FILTER (WHERE h.online)::numeric / NULLIF(COUNT(*), 0)) * 100, 2) AS uptime_pct,
      ROUND(AVG(GREATEST(h.latency_ms, 0)))::int AS avg_latency_ms,
      COALESCE(
        ROUND(percentile_disc(0.95) WITHIN GROUP (ORDER BY GREATEST(h.latency_ms, 0)))::int,
        0
      ) AS p95_latency_ms
    FROM public.rte_gateway_health h
    WHERE (h.checked_at AT TIME ZONE 'utc')::date = target_day
    GROUP BY 1, 2
  ), scored AS (
    SELECT
      a.*,
      LEAST(
        999.99,
        GREATEST(
          0,
          CASE WHEN (100 - v_uptime_target) <= 0
               THEN CASE WHEN a.uptime_pct >= 100 THEN 0 ELSE 100 END
               ELSE ROUND(((100 - a.uptime_pct) / (100 - v_uptime_target)) * 100, 2)
          END
        )
      ) AS error_budget_used_pct
    FROM agg a
  )
  INSERT INTO public.rte_slo_daily_snapshots AS s (
    day, gateway, checks, failures, uptime_pct, avg_latency_ms, p95_latency_ms,
    error_budget_used_pct, status, uptime_target_pct, latency_p95_budget_ms
  )
  SELECT
    sc.day, sc.gateway, sc.checks, sc.failures, sc.uptime_pct, sc.avg_latency_ms, sc.p95_latency_ms,
    sc.error_budget_used_pct,
    CASE
      WHEN sc.uptime_pct < v_uptime_target OR sc.p95_latency_ms > v_latency_budget THEN 'violado'
      WHEN sc.error_budget_used_pct >= 75 OR sc.p95_latency_ms > (v_latency_budget * 0.8) THEN 'atencao'
      ELSE 'ok'
    END,
    v_uptime_target, v_latency_budget
  FROM scored sc
  ON CONFLICT (day, gateway) DO UPDATE SET
    checks = EXCLUDED.checks,
    failures = EXCLUDED.failures,
    uptime_pct = EXCLUDED.uptime_pct,
    avg_latency_ms = EXCLUDED.avg_latency_ms,
    p95_latency_ms = EXCLUDED.p95_latency_ms,
    error_budget_used_pct = EXCLUDED.error_budget_used_pct,
    status = EXCLUDED.status,
    uptime_target_pct = EXCLUDED.uptime_target_pct,
    latency_p95_budget_ms = EXCLUDED.latency_p95_budget_ms,
    updated_at = now();

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$function$

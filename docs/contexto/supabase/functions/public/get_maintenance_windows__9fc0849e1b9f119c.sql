CREATE OR REPLACE FUNCTION public.get_maintenance_windows(p_days integer DEFAULT 30, p_window_hours integer DEFAULT 2, p_limit integer DEFAULT 3)
 RETURNS TABLE(rank integer, day_of_week integer, day_name text, start_hour integer, end_hour integer, avg_load numeric, peak_load numeric, vs_daily_peak_pct numeric, recommendation text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_daily_peak numeric;
  v_dow_names text[] := ARRAY['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;

  SELECT COALESCE(MAX(avg_conn), 0) INTO v_daily_peak FROM (
    SELECT AVG(active_connections) AS avg_conn
      FROM public.db_health_snapshots
     WHERE created_at >= now() - (p_days || ' days')::interval
       AND active_connections IS NOT NULL
     GROUP BY EXTRACT(DOW FROM created_at), EXTRACT(HOUR FROM created_at)
  ) t;

  RETURN QUERY
  WITH hourly AS (
    SELECT
      EXTRACT(DOW  FROM created_at)::int AS dow,
      EXTRACT(HOUR FROM created_at)::int AS hr,
      AVG(active_connections)::numeric AS avg_load,
      MAX(active_connections)::numeric AS peak_load
    FROM public.db_health_snapshots
    WHERE created_at >= now() - (p_days || ' days')::interval
      AND active_connections IS NOT NULL
    GROUP BY 1, 2
  ),
  windows AS (
    SELECT
      h.dow,
      h.hr AS start_hr,
      ((h.hr + p_window_hours - 1) % 24) AS end_hr,
      AVG(h2.avg_load) AS window_avg,
      MAX(h2.peak_load) AS window_peak
    FROM hourly h
    JOIN hourly h2
      ON h2.dow = h.dow
     AND h2.hr IN (SELECT (h.hr + gs) % 24 FROM generate_series(0, p_window_hours - 1) gs)
    GROUP BY h.dow, h.hr
    HAVING COUNT(*) = p_window_hours
  ),
  ranked AS (
    SELECT
      w.*,
      ROW_NUMBER() OVER (ORDER BY window_avg ASC, window_peak ASC) AS rk
    FROM windows w
  )
  SELECT
    rk::int,
    dow,
    v_dow_names[dow + 1],
    start_hr,
    end_hr,
    ROUND(window_avg, 2),
    ROUND(window_peak, 2),
    CASE WHEN v_daily_peak > 0 THEN ROUND((window_avg / v_daily_peak * 100), 1) ELSE 0 END,
    CASE
      WHEN v_daily_peak > 0 AND (window_avg / v_daily_peak) < 0.2 THEN '✅ Excelente — carga mínima'
      WHEN v_daily_peak > 0 AND (window_avg / v_daily_peak) < 0.4 THEN '👍 Boa janela'
      ELSE '⚠️ Aceitável — evite operações longas'
    END
  FROM ranked
  WHERE rk <= p_limit
  ORDER BY rk;
END; $function$

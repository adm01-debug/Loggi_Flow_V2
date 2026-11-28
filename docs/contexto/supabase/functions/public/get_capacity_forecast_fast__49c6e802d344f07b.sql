CREATE OR REPLACE FUNCTION public.get_capacity_forecast_fast(p_hours_ahead integer DEFAULT 168)
 RETURNS TABLE(metric text, current_value numeric, slope_per_hour numeric, forecast_value numeric, hours_ahead integer, threshold numeric, hours_until_threshold numeric, severity text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT public.has_role(auth.uid(), 'admin') INTO v_is_admin;
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      EXTRACT(EPOCH FROM (s.created_at - (now() - interval '7 days'))) / 3600.0 AS x_hours,
      s.active_connections::numeric AS conn,
      s.db_size_bytes::numeric AS size_b,
      s.created_at
    FROM public.db_health_snapshots s
    WHERE s.created_at >= now() - interval '7 days'
      AND s.active_connections IS NOT NULL
      AND s.db_size_bytes IS NOT NULL
  ),
  stats AS (
    SELECT
      COUNT(*) AS n,
      regr_slope(b.conn, b.x_hours)::numeric  AS slope_conn,
      regr_intercept(b.conn, b.x_hours)::numeric AS icpt_conn,
      regr_slope(b.size_b, b.x_hours)::numeric AS slope_size,
      regr_intercept(b.size_b, b.x_hours)::numeric AS icpt_size,
      MAX(b.x_hours)::numeric AS x_now,
      (SELECT conn FROM base ORDER BY created_at DESC LIMIT 1) AS curr_conn,
      (SELECT size_b FROM base ORDER BY created_at DESC LIMIT 1) AS curr_size
    FROM base b
  ),
  forecasts AS (
    SELECT 'active_connections'::text AS metric,
           st.curr_conn AS current_value,
           COALESCE(st.slope_conn, 0)::numeric AS slope_per_hour,
           COALESCE(st.icpt_conn + st.slope_conn * (st.x_now + p_hours_ahead), st.curr_conn)::numeric AS forecast_value,
           80::numeric AS threshold
    FROM stats st WHERE st.n >= 3
    UNION ALL
    SELECT 'db_size_gb'::text,
           (st.curr_size / 1073741824::numeric),
           (COALESCE(st.slope_size, 0)::numeric / 1073741824::numeric),
           (COALESCE(st.icpt_size + st.slope_size * (st.x_now + p_hours_ahead), st.curr_size)::numeric / 1073741824::numeric),
           8::numeric
    FROM stats st WHERE st.n >= 3
  )
  SELECT
    f.metric,
    ROUND(f.current_value, 2),
    ROUND(f.slope_per_hour, 4),
    ROUND(f.forecast_value, 2),
    p_hours_ahead,
    f.threshold,
    CASE
      WHEN f.slope_per_hour <= 0 THEN NULL
      WHEN f.current_value >= f.threshold THEN 0
      ELSE ROUND((f.threshold - f.current_value) / f.slope_per_hour, 1)
    END AS hours_until_threshold,
    CASE
      WHEN f.current_value >= f.threshold THEN 'critical'
      WHEN f.slope_per_hour > 0 AND (f.threshold - f.current_value) / f.slope_per_hour < 48 THEN 'critical'
      WHEN f.slope_per_hour > 0 AND (f.threshold - f.current_value) / f.slope_per_hour < 168 THEN 'warning'
      ELSE 'ok'
    END AS severity
  FROM forecasts f;
END;
$function$


-- Sprint 40: Forecast de capacidade via regressão linear sobre db_health_snapshots
CREATE OR REPLACE FUNCTION public.get_capacity_forecast_fast(p_hours_ahead integer DEFAULT 168)
RETURNS TABLE(
  metric text,
  current_value numeric,
  slope_per_hour numeric,
  forecast_value numeric,
  hours_ahead integer,
  threshold numeric,
  hours_until_threshold numeric,
  severity text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
      EXTRACT(EPOCH FROM (created_at - (now() - interval '7 days'))) / 3600.0 AS x_hours,
      active_connections::numeric AS conn,
      db_size_bytes::numeric AS size_b,
      created_at
    FROM public.db_health_snapshots
    WHERE created_at >= now() - interval '7 days'
      AND active_connections IS NOT NULL
      AND db_size_bytes IS NOT NULL
  ),
  stats AS (
    SELECT
      COUNT(*) AS n,
      regr_slope(conn, x_hours)  AS slope_conn,
      regr_intercept(conn, x_hours) AS icpt_conn,
      regr_slope(size_b, x_hours) AS slope_size,
      regr_intercept(size_b, x_hours) AS icpt_size,
      MAX(x_hours) AS x_now,
      (SELECT conn FROM base ORDER BY created_at DESC LIMIT 1) AS curr_conn,
      (SELECT size_b FROM base ORDER BY created_at DESC LIMIT 1) AS curr_size
    FROM base
  ),
  forecasts AS (
    SELECT 'active_connections'::text AS metric,
           curr_conn AS current_value,
           COALESCE(slope_conn, 0) AS slope_per_hour,
           COALESCE(icpt_conn + slope_conn * (x_now + p_hours_ahead), curr_conn) AS forecast_value,
           80::numeric AS threshold
    FROM stats WHERE n >= 3
    UNION ALL
    SELECT 'db_size_gb'::text,
           curr_size / (1024^3),
           COALESCE(slope_size, 0) / (1024^3),
           COALESCE(icpt_size + slope_size * (x_now + p_hours_ahead), curr_size) / (1024^3),
           8::numeric
    FROM stats WHERE n >= 3
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
$$;

REVOKE ALL ON FUNCTION public.get_capacity_forecast_fast(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_capacity_forecast_fast(integer) TO authenticated;

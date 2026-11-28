CREATE OR REPLACE FUNCTION public.get_load_heatmap(p_days integer DEFAULT 30)
 RETURNS TABLE(day_of_week integer, hour_of_day integer, sample_count bigint, avg_active_connections numeric, max_active_connections integer, avg_cache_hit_ratio numeric, intensity numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_max numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;

  SELECT MAX(avg_conn) INTO v_max FROM (
    SELECT AVG(active_connections) AS avg_conn
      FROM public.db_health_snapshots
     WHERE created_at >= now() - (p_days || ' days')::interval
       AND active_connections IS NOT NULL
     GROUP BY EXTRACT(DOW FROM created_at), EXTRACT(HOUR FROM created_at)
  ) t;

  RETURN QUERY
  SELECT
    EXTRACT(DOW  FROM created_at)::int AS day_of_week,
    EXTRACT(HOUR FROM created_at)::int AS hour_of_day,
    count(*)::bigint,
    ROUND(AVG(active_connections)::numeric, 2),
    MAX(active_connections)::int,
    ROUND(AVG(cache_hit_ratio)::numeric, 2),
    CASE WHEN COALESCE(v_max, 0) > 0
         THEN ROUND((AVG(active_connections) / v_max)::numeric, 3)
         ELSE 0 END
  FROM public.db_health_snapshots
  WHERE created_at >= now() - (p_days || ' days')::interval
    AND active_connections IS NOT NULL
  GROUP BY 1, 2
  ORDER BY 1, 2;
END; $function$

CREATE OR REPLACE FUNCTION public.get_remediation_mttr_fast()
 RETURNS TABLE(category text, total_applied bigint, total_resolved bigint, total_ignored bigint, total_pending bigint, resolution_rate_pct numeric, mttr_hours numeric, mttr_p50_hours numeric, mttr_p95_hours numeric, last_resolved_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      r.category,
      r.status,
      r.applied_at,
      r.resolved_at,
      EXTRACT(EPOCH FROM (r.resolved_at - r.applied_at)) / 3600.0 AS resolve_hours
    FROM public.remediation_actions r
    WHERE r.created_at >= now() - interval '30 days'
  )
  SELECT
    b.category,
    count(*)::bigint AS total_applied,
    count(*) FILTER (WHERE b.status = 'resolved')::bigint AS total_resolved,
    count(*) FILTER (WHERE b.status = 'ignored')::bigint AS total_ignored,
    count(*) FILTER (WHERE b.status IN ('pending','in_progress'))::bigint AS total_pending,
    ROUND(
      100.0 * count(*) FILTER (WHERE b.status = 'resolved')::numeric
        / NULLIF(count(*), 0),
      2
    ) AS resolution_rate_pct,
    ROUND(AVG(b.resolve_hours) FILTER (WHERE b.status = 'resolved')::numeric, 2) AS mttr_hours,
    ROUND(
      percentile_cont(0.5) WITHIN GROUP (ORDER BY b.resolve_hours)
        FILTER (WHERE b.status = 'resolved')::numeric,
      2
    ) AS mttr_p50_hours,
    ROUND(
      percentile_cont(0.95) WITHIN GROUP (ORDER BY b.resolve_hours)
        FILTER (WHERE b.status = 'resolved')::numeric,
      2
    ) AS mttr_p95_hours,
    MAX(b.resolved_at) FILTER (WHERE b.status = 'resolved') AS last_resolved_at
  FROM base b
  GROUP BY b.category
  ORDER BY total_applied DESC;
END;
$function$

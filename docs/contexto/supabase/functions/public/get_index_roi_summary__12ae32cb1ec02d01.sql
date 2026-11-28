CREATE OR REPLACE FUNCTION public.get_index_roi_summary()
 RETURNS TABLE(total_proposed bigint, total_applied bigint, total_reverted bigint, total_rejected bigint, measured_count bigint, avg_improvement_pct numeric, best_improvement_pct numeric, worst_improvement_pct numeric, total_ms_saved_per_call numeric, effective_indexes bigint, ineffective_indexes bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    count(*) FILTER (WHERE status = 'proposed')::bigint,
    count(*) FILTER (WHERE status = 'applied')::bigint,
    count(*) FILTER (WHERE status = 'reverted')::bigint,
    count(*) FILTER (WHERE status = 'rejected')::bigint,
    count(*) FILTER (WHERE improvement_pct IS NOT NULL)::bigint,
    ROUND(AVG(improvement_pct) FILTER (WHERE improvement_pct IS NOT NULL)::numeric, 2),
    ROUND(MAX(improvement_pct)::numeric, 2),
    ROUND(MIN(improvement_pct)::numeric, 2),
    ROUND(SUM(GREATEST(baseline_mean_ms - post_apply_mean_ms, 0))
            FILTER (WHERE status = 'applied' AND improvement_pct > 0)::numeric, 2),
    count(*) FILTER (WHERE status = 'applied' AND improvement_pct >= 5)::bigint,
    count(*) FILTER (WHERE status IN ('applied','reverted') AND (improvement_pct IS NULL OR improvement_pct < 5))::bigint
  FROM public.index_proposals;
END; $function$

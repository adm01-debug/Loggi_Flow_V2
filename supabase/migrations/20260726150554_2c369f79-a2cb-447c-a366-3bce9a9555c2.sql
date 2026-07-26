CREATE INDEX IF NOT EXISTS idx_rte_gateway_health_gateway_checked_at
  ON public.rte_gateway_health (gateway, checked_at DESC);

CREATE OR REPLACE FUNCTION public.purge_rte_gateway_health(retention_days integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed integer;
BEGIN
  IF retention_days IS NULL OR retention_days < 1 THEN
    retention_days := 30;
  END IF;

  DELETE FROM public.rte_gateway_health
  WHERE checked_at < now() - make_interval(days => retention_days);

  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_rte_gateway_health(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purge_rte_gateway_health(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.rte_gateway_sustained_downtime(window_hours integer DEFAULT 2)
RETURNS TABLE (
  gateway text,
  checks bigint,
  last_checked_at timestamptz,
  last_error text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT h.gateway,
         count(*) AS checks,
         max(h.checked_at) AS last_checked_at,
         (array_agg(h.error_message ORDER BY h.checked_at DESC))[1] AS last_error
  FROM public.rte_gateway_health h
  WHERE h.checked_at >= now() - make_interval(hours => GREATEST(COALESCE(window_hours, 2), 1))
  GROUP BY h.gateway
  HAVING bool_and(NOT h.online) AND count(*) >= 2;
$$;

REVOKE ALL ON FUNCTION public.rte_gateway_sustained_downtime(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rte_gateway_sustained_downtime(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rte_gateway_sustained_downtime(integer) TO service_role;
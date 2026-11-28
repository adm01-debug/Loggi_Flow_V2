CREATE OR REPLACE FUNCTION public.rte_gateway_sustained_downtime(window_hours integer DEFAULT 2)
 RETURNS TABLE(gateway text, checks bigint, last_checked_at timestamp with time zone, last_error text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT h.gateway,
         count(*) AS checks,
         max(h.checked_at) AS last_checked_at,
         (array_agg(h.error_message ORDER BY h.checked_at DESC))[1] AS last_error
  FROM public.rte_gateway_health h
  WHERE h.checked_at >= now() - make_interval(hours => GREATEST(COALESCE(window_hours, 2), 1))
  GROUP BY h.gateway
  HAVING bool_and(NOT h.online) AND count(*) >= 2;
$function$

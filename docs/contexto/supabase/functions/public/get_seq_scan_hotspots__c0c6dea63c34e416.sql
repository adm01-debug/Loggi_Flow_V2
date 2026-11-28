CREATE OR REPLACE FUNCTION public.get_seq_scan_hotspots(p_min_live_tuples bigint DEFAULT 10000, p_limit integer DEFAULT 20)
 RETURNS TABLE(schema_name text, table_name text, live_tuples bigint, seq_scan bigint, seq_tup_read bigint, idx_scan bigint, idx_tup_fetch bigint, seq_ratio numeric, avg_tuples_per_scan numeric, table_size_bytes bigint, severity text)
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
    s.schemaname::text,
    s.relname::text,
    s.n_live_tup::bigint,
    s.seq_scan::bigint,
    s.seq_tup_read::bigint,
    COALESCE(s.idx_scan, 0)::bigint,
    COALESCE(s.idx_tup_fetch, 0)::bigint,
    CASE
      WHEN (s.seq_scan + COALESCE(s.idx_scan, 0)) > 0
      THEN ROUND((s.seq_scan::numeric / (s.seq_scan + COALESCE(s.idx_scan, 0))) * 100, 2)
      ELSE 0
    END AS seq_ratio,
    CASE
      WHEN s.seq_scan > 0
      THEN ROUND(s.seq_tup_read::numeric / s.seq_scan, 1)
      ELSE 0
    END AS avg_tuples_per_scan,
    pg_total_relation_size(format('%I.%I', s.schemaname, s.relname)::regclass)::bigint,
    CASE
      WHEN s.n_live_tup >= 100000 AND s.seq_scan > COALESCE(s.idx_scan, 0) * 2 THEN 'critical'
      WHEN s.n_live_tup >= 50000 AND s.seq_scan > COALESCE(s.idx_scan, 0) THEN 'warning'
      ELSE 'info'
    END::text AS severity
  FROM pg_stat_user_tables s
  WHERE s.schemaname = 'public'
    AND s.n_live_tup >= p_min_live_tuples
    AND s.seq_scan > 0
  ORDER BY (s.seq_scan::numeric * s.n_live_tup) DESC
  LIMIT p_limit;
END;
$function$

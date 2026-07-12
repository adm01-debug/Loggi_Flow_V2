
CREATE OR REPLACE FUNCTION public.get_cache_hit_ratios(
  p_min_reads bigint DEFAULT 10000,
  p_max_ratio numeric DEFAULT 0.99,
  p_limit integer DEFAULT 30
)
RETURNS TABLE (
  schema_name text,
  table_name text,
  heap_blks_read bigint,
  heap_blks_hit bigint,
  heap_hit_ratio numeric,
  idx_blks_read bigint,
  idx_blks_hit bigint,
  idx_hit_ratio numeric,
  combined_hit_ratio numeric,
  table_size_bytes bigint,
  severity text,
  recommendation text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  WITH stats AS (
    SELECT
      s.schemaname::text AS schema_name,
      s.relname::text AS table_name,
      s.heap_blks_read,
      s.heap_blks_hit,
      COALESCE(s.idx_blks_read, 0) AS idx_blks_read,
      COALESCE(s.idx_blks_hit, 0) AS idx_blks_hit,
      pg_total_relation_size(format('%I.%I', s.schemaname, s.relname)::regclass) AS table_size_bytes
    FROM pg_statio_user_tables s
    WHERE s.schemaname = 'public'
  ),
  ratios AS (
    SELECT
      schema_name,
      table_name,
      heap_blks_read,
      heap_blks_hit,
      CASE WHEN (heap_blks_read + heap_blks_hit) > 0
        THEN ROUND((heap_blks_hit::numeric / NULLIF(heap_blks_read + heap_blks_hit, 0)), 4)
        ELSE 1 END AS heap_hit_ratio,
      idx_blks_read,
      idx_blks_hit,
      CASE WHEN (idx_blks_read + idx_blks_hit) > 0
        THEN ROUND((idx_blks_hit::numeric / NULLIF(idx_blks_read + idx_blks_hit, 0)), 4)
        ELSE 1 END AS idx_hit_ratio,
      CASE WHEN (heap_blks_read + heap_blks_hit + idx_blks_read + idx_blks_hit) > 0
        THEN ROUND(((heap_blks_hit + idx_blks_hit)::numeric /
                    NULLIF(heap_blks_read + heap_blks_hit + idx_blks_read + idx_blks_hit, 0)), 4)
        ELSE 1 END AS combined_hit_ratio,
      table_size_bytes
    FROM stats
  )
  SELECT
    r.schema_name,
    r.table_name,
    r.heap_blks_read,
    r.heap_blks_hit,
    r.heap_hit_ratio,
    r.idx_blks_read,
    r.idx_blks_hit,
    r.idx_hit_ratio,
    r.combined_hit_ratio,
    r.table_size_bytes,
    CASE
      WHEN r.combined_hit_ratio < 0.90 THEN 'critical'
      WHEN r.combined_hit_ratio < 0.95 THEN 'warning'
      WHEN r.combined_hit_ratio < p_max_ratio THEN 'info'
      ELSE 'ok'
    END AS severity,
    CASE
      WHEN r.combined_hit_ratio < 0.90 AND r.table_size_bytes > 100 * 1024 * 1024
        THEN 'Tabela grande com cache baixo — considere aumentar shared_buffers ou particionar.'
      WHEN r.idx_hit_ratio < 0.95 AND r.heap_hit_ratio >= 0.98
        THEN 'Cache de índice baixo — revise índices desnecessários ou aumente shared_buffers.'
      WHEN r.heap_hit_ratio < 0.95
        THEN 'Muitas leituras de heap em disco — crie índices cobrindo consultas frequentes.'
      ELSE 'Monitorar — ratio abaixo do alvo mas não crítico.'
    END AS recommendation
  FROM ratios r
  WHERE (r.heap_blks_read + r.idx_blks_read) >= p_min_reads
    AND r.combined_hit_ratio < p_max_ratio
  ORDER BY r.combined_hit_ratio ASC, r.table_size_bytes DESC
  LIMIT p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.get_cache_hit_ratios(bigint, numeric, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_cache_hit_ratios(bigint, numeric, integer) TO authenticated;

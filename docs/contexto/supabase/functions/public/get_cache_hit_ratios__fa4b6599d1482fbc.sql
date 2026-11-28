CREATE OR REPLACE FUNCTION public.get_cache_hit_ratios(p_min_reads bigint DEFAULT 10000, p_max_ratio numeric DEFAULT 0.99, p_limit integer DEFAULT 30)
 RETURNS TABLE(schema_name text, table_name text, heap_blks_read bigint, heap_blks_hit bigint, heap_hit_ratio numeric, idx_blks_read bigint, idx_blks_hit bigint, idx_hit_ratio numeric, combined_hit_ratio numeric, table_size_bytes bigint, severity text, recommendation text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  WITH stats AS (
    SELECT
      s.schemaname::text AS c_schema,
      s.relname::text AS c_table,
      s.heap_blks_read AS c_hbr,
      s.heap_blks_hit AS c_hbh,
      COALESCE(s.idx_blks_read, 0) AS c_ibr,
      COALESCE(s.idx_blks_hit, 0) AS c_ibh,
      pg_total_relation_size(format('%I.%I', s.schemaname, s.relname)::regclass) AS c_size
    FROM pg_statio_user_tables s
    WHERE s.schemaname = 'public'
  ),
  ratios AS (
    SELECT
      st.c_schema,
      st.c_table,
      st.c_hbr,
      st.c_hbh,
      CASE WHEN (st.c_hbr + st.c_hbh) > 0
        THEN ROUND((st.c_hbh::numeric / NULLIF(st.c_hbr + st.c_hbh, 0)), 4)
        ELSE 1 END AS c_heap_ratio,
      st.c_ibr,
      st.c_ibh,
      CASE WHEN (st.c_ibr + st.c_ibh) > 0
        THEN ROUND((st.c_ibh::numeric / NULLIF(st.c_ibr + st.c_ibh, 0)), 4)
        ELSE 1 END AS c_idx_ratio,
      CASE WHEN (st.c_hbr + st.c_hbh + st.c_ibr + st.c_ibh) > 0
        THEN ROUND(((st.c_hbh + st.c_ibh)::numeric /
                    NULLIF(st.c_hbr + st.c_hbh + st.c_ibr + st.c_ibh, 0)), 4)
        ELSE 1 END AS c_comb_ratio,
      st.c_size
    FROM stats st
  )
  SELECT
    r.c_schema,
    r.c_table,
    r.c_hbr,
    r.c_hbh,
    r.c_heap_ratio,
    r.c_ibr,
    r.c_ibh,
    r.c_idx_ratio,
    r.c_comb_ratio,
    r.c_size,
    CASE
      WHEN r.c_comb_ratio < 0.90 THEN 'critical'
      WHEN r.c_comb_ratio < 0.95 THEN 'warning'
      WHEN r.c_comb_ratio < p_max_ratio THEN 'info'
      ELSE 'ok'
    END::text,
    CASE
      WHEN r.c_comb_ratio < 0.90 AND r.c_size > 100 * 1024 * 1024
        THEN 'Tabela grande com cache baixo - considere aumentar shared_buffers ou particionar.'
      WHEN r.c_idx_ratio < 0.95 AND r.c_heap_ratio >= 0.98
        THEN 'Cache de indice baixo - revise indices desnecessarios ou aumente shared_buffers.'
      WHEN r.c_heap_ratio < 0.95
        THEN 'Muitas leituras de heap em disco - crie indices cobrindo consultas frequentes.'
      ELSE 'Monitorar - ratio abaixo do alvo mas nao critico.'
    END::text
  FROM ratios r
  WHERE (r.c_hbr + r.c_ibr) >= p_min_reads
    AND r.c_comb_ratio < p_max_ratio
  ORDER BY r.c_comb_ratio ASC, r.c_size DESC
  LIMIT p_limit;
END;
$function$

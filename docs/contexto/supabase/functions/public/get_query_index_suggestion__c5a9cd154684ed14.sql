CREATE OR REPLACE FUNCTION public.get_query_index_suggestion(p_queryid bigint)
 RETURNS TABLE(suggestion_type text, target_table text, target_columns text[], recommended_ddl text, rationale text, confidence text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'internal', 'public', 'extensions', 'pg_catalog'
AS $function$
DECLARE
  v_query text;
  v_table text;
  v_col text;
  v_match text[];
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;

  SELECT query INTO v_query FROM extensions.pg_stat_statements WHERE queryid = p_queryid LIMIT 1;
  IF v_query IS NULL THEN
    RETURN;
  END IF;

  -- Heurística: extrai FROM <table> e coluna do primeiro WHERE
  v_match := regexp_matches(v_query, 'from\s+([a-z_][a-z0-9_\.]*)', 'i');
  v_table := COALESCE(v_match[1], NULL);

  v_match := regexp_matches(v_query, 'where\s+([a-z_][a-z0-9_]*)\s*(=|>|<|>=|<=|in|like)', 'i');
  v_col := COALESCE(v_match[1], NULL);

  IF v_table IS NOT NULL AND v_col IS NOT NULL THEN
    RETURN QUERY SELECT
      'index_where'::text,
      v_table,
      ARRAY[v_col],
      format('CREATE INDEX IF NOT EXISTS idx_%s_%s ON %s (%s);',
             regexp_replace(v_table, '\.', '_', 'g'), v_col, v_table, v_col),
      format('Coluna %s aparece em cláusula WHERE do queryid %s. Índice pode reduzir seq scans.',
             v_col, p_queryid),
      'medium'::text;
  END IF;

  -- JOIN heuristic
  v_match := regexp_matches(v_query, 'join\s+([a-z_][a-z0-9_\.]*)\s+.*?on\s+[a-z_\.]*\.([a-z_][a-z0-9_]*)\s*=', 'i');
  IF v_match IS NOT NULL THEN
    RETURN QUERY SELECT
      'index_join'::text,
      v_match[1],
      ARRAY[v_match[2]],
      format('CREATE INDEX IF NOT EXISTS idx_%s_%s ON %s (%s);',
             regexp_replace(v_match[1], '\.', '_', 'g'), v_match[2], v_match[1], v_match[2]),
      format('Coluna %s usada em JOIN. Índice acelera lookup.', v_match[2]),
      'medium'::text;
  END IF;

  -- Se não encontrou, sugere EXPLAIN
  RETURN QUERY SELECT
    'manual_review'::text,
    NULL::text,
    NULL::text[],
    format('EXPLAIN (ANALYZE, BUFFERS) %s;', substring(v_query from 1 for 500)),
    'Rode EXPLAIN ANALYZE para inspecionar plano e identificar bottleneck manualmente.',
    'low'::text;
END; $function$

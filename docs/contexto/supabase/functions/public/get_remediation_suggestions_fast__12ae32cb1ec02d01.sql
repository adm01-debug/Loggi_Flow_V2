CREATE OR REPLACE FUNCTION public.get_remediation_suggestions_fast()
 RETURNS TABLE(id text, category text, severity text, title text, detail text, recommended_action text, evidence jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_catalog'
AS $function$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT public.has_role(auth.uid(), 'admin') INTO v_is_admin;
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- 1) Regressões críticas → sugerir análise de plano + índice
  RETURN QUERY
  SELECT
    'regression_' || r.queryid::text,
    'query'::text,
    CASE WHEN r.regression_pct >= 100 THEN 'critical' ELSE 'warning' END,
    format('Query %s está %s%% mais lenta', r.queryid, round(r.regression_pct, 0)),
    format('Média atual %sms vs baseline %sms', round(r.current_mean_ms::numeric, 1), round(r.baseline_mean_ms::numeric, 1)),
    'Rodar EXPLAIN (ANALYZE, BUFFERS) e avaliar índice na coluna de filtro/join.'::text,
    jsonb_build_object('queryid', r.queryid, 'query', r.query_text, 'regression_pct', r.regression_pct)
  FROM public.get_query_regressions_fast() r
  WHERE r.regression_pct >= 50
  LIMIT 10;

  -- 2) Top queries de alto total_exec → candidatas a cache/materialized view
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
    RETURN QUERY
    EXECUTE $f$
      SELECT
        'hotpath_' || s.queryid::text,
        'hotpath',
        CASE WHEN s.total_exec_time > 60000 THEN 'critical'
             WHEN s.total_exec_time > 10000 THEN 'warning'
             ELSE 'ok' END,
        'Hot path: ' || left(s.query, 80),
        format('%s chamadas · %sms total · %sms média',
               s.calls, round(s.total_exec_time::numeric, 0), round(s.mean_exec_time::numeric, 1)),
        'Avaliar cache no cliente (React Query staleTime) ou materialized view refresh periódico.',
        jsonb_build_object('queryid', s.queryid, 'calls', s.calls,
                           'total_ms', round(s.total_exec_time::numeric, 0),
                           'mean_ms', round(s.mean_exec_time::numeric, 1))
      FROM extensions.pg_stat_statements s
     WHERE s.query NOT LIKE '%%pg_stat_statements%%'
       AND s.total_exec_time > 10000
     ORDER BY s.total_exec_time DESC
     LIMIT 5
    $f$;
  END IF;

  -- 3) Deadlocks recentes → revisar ordem de locks
  RETURN QUERY
  SELECT
    'deadlocks_recent'::text,
    'contention'::text,
    'warning'::text,
    'Deadlocks detectados nas últimas 24h'::text,
    format('%s deadlocks acumulados na leitura mais recente', COALESCE(latest.deadlocks, 0))::text,
    'Padronizar ordem de acesso a tabelas em transações e reduzir tempo de lock.'::text,
    jsonb_build_object('deadlocks', latest.deadlocks, 'at', latest.created_at)
  FROM (
    SELECT deadlocks, created_at
    FROM public.db_health_snapshots
    ORDER BY created_at DESC LIMIT 1
  ) latest
  WHERE COALESCE(latest.deadlocks, 0) > 0;

  -- 4) Cache hit ratio baixo → aumentar shared_buffers / compute
  RETURN QUERY
  SELECT
    'cache_low'::text,
    'capacity'::text,
    CASE WHEN latest.cache_hit_ratio < 90 THEN 'critical' ELSE 'warning' END,
    'Cache hit ratio abaixo do alvo (95%)'::text,
    format('Última leitura: %s%%', round(latest.cache_hit_ratio, 2))::text,
    'Considerar aumentar o tamanho da instância do banco para expandir shared_buffers.'::text,
    jsonb_build_object('cache_hit_ratio', latest.cache_hit_ratio, 'at', latest.created_at)
  FROM (
    SELECT cache_hit_ratio, created_at
    FROM public.db_health_snapshots
    WHERE cache_hit_ratio IS NOT NULL
    ORDER BY created_at DESC LIMIT 1
  ) latest
  WHERE latest.cache_hit_ratio < 95;

  -- 5) Conexões próximas do limite → pooling/PgBouncer
  RETURN QUERY
  SELECT
    'conn_pressure'::text,
    'capacity'::text,
    CASE WHEN latest.active_connections >= 60 THEN 'critical' ELSE 'warning' END,
    'Conexões ativas elevadas'::text,
    format('Última leitura: %s conexões ativas', latest.active_connections)::text,
    'Ativar pooling (PgBouncer transaction mode) no lado do app ou aumentar compute.'::text,
    jsonb_build_object('active_connections', latest.active_connections, 'at', latest.created_at)
  FROM (
    SELECT active_connections, created_at
    FROM public.db_health_snapshots
    WHERE active_connections IS NOT NULL
    ORDER BY created_at DESC LIMIT 1
  ) latest
  WHERE latest.active_connections >= 40;
END;
$function$

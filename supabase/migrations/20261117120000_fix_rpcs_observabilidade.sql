-- Corrige as 8 RPCs de observabilidade de banco que nunca executaram com sucesso.
-- Erros reais capturados em producao com JWT de admin (PostgREST /rest/v1/rpc/*):
--   42803 get_active_sessions_summary  -> a.state fora do GROUP BY
--   42702 get_temp_file_stats          -> "temp_files" ambiguo (OUT param x coluna)
--   42804 get_unindexed_foreign_keys   -> name[] onde a assinatura declara text[]
--   42883 get_capacity_forecast_fast   -> round(double precision, integer) inexistente
--   42702 get_cache_hit_ratios         -> "schema_name" ambiguo (OUT param x coluna do CTE)
--   42883 get_top_tables_by_size       -> round(double precision, integer) inexistente
--   42501 get_wal_health               -> pg_stat_file nao e concedivel no Supabase gerenciado
--   42702 get_transaction_health       -> "deadlocks" ambiguo (OUT param x coluna)
-- Apenas CREATE OR REPLACE: nenhuma alteracao de dados, tabela ou grant.

-- 1) 42803: agrupar pelas colunas base permite qualquer expressao sobre elas no SELECT.
CREATE OR REPLACE FUNCTION public.get_active_sessions_summary()
RETURNS TABLE(
  state text,
  wait_event_type text,
  session_count bigint,
  oldest_session_seconds numeric,
  longest_query_seconds numeric,
  longest_xact_seconds numeric,
  sample_query text,
  severity text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(a.state, 'unknown')::text,
    COALESCE(a.wait_event_type, 'none')::text,
    count(*)::bigint,
    ROUND(EXTRACT(EPOCH FROM (now() - min(a.backend_start)))::numeric, 1),
    ROUND(EXTRACT(EPOCH FROM (now() - min(a.query_start)))::numeric, 1),
    ROUND(EXTRACT(EPOCH FROM (now() - min(a.xact_start)))::numeric, 1),
    (array_agg(left(a.query, 200) ORDER BY a.query_start NULLS LAST))[1],
    CASE
      WHEN COALESCE(a.state,'') = 'idle in transaction'
        AND EXTRACT(EPOCH FROM (now() - min(a.xact_start))) > 300 THEN 'critical'
      WHEN COALESCE(a.state,'') = 'idle in transaction'
        AND EXTRACT(EPOCH FROM (now() - min(a.xact_start))) > 60 THEN 'warning'
      WHEN a.wait_event_type = 'Lock'
        AND EXTRACT(EPOCH FROM (now() - min(a.query_start))) > 30 THEN 'critical'
      WHEN COALESCE(a.state,'') = 'active'
        AND EXTRACT(EPOCH FROM (now() - min(a.query_start))) > 60 THEN 'warning'
      ELSE 'ok'
    END::text
  FROM pg_stat_activity a
  WHERE a.datname = current_database()
    AND a.pid <> pg_backend_pid()
    AND a.backend_type = 'client backend'
  GROUP BY a.state, a.wait_event_type
  ORDER BY count(*) DESC;
END;
$function$;

-- 2) 42702: qualificar pg_stat_database com alias remove a colisao com os OUT params.
CREATE OR REPLACE FUNCTION public.get_temp_file_stats(p_limit integer DEFAULT 20)
RETURNS TABLE (
  scope text,
  identifier text,
  temp_files bigint,
  temp_bytes bigint,
  calls bigint,
  mean_exec_ms numeric,
  query_text text,
  severity text,
  recommendation text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_catalog
AS $function$
DECLARE
  v_db_files bigint;
  v_db_bytes bigint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  SELECT COALESCE(d.temp_files, 0), COALESCE(d.temp_bytes, 0)
    INTO v_db_files, v_db_bytes
    FROM pg_stat_database d WHERE d.datname = current_database();

  RETURN QUERY
  SELECT
    'database'::text,
    current_database()::text,
    v_db_files,
    v_db_bytes,
    NULL::bigint,
    NULL::numeric,
    NULL::text,
    CASE
      WHEN v_db_bytes >= 10::bigint * 1024 * 1024 * 1024 THEN 'critical'
      WHEN v_db_bytes >= 1::bigint  * 1024 * 1024 * 1024 THEN 'warning'
      WHEN v_db_bytes >= 100 * 1024 * 1024 THEN 'info'
      ELSE 'ok'
    END::text,
    CASE
      WHEN v_db_bytes >= 1::bigint * 1024 * 1024 * 1024
        THEN 'Volume alto de spill - aumente work_mem/maintenance_work_mem ou reduza sorts/hash joins.'
      WHEN v_db_bytes >= 100 * 1024 * 1024
        THEN 'Spill moderado - monitorar e ajustar work_mem se persistir.'
      ELSE 'Uso saudavel de arquivos temporarios.'
    END::text;

  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements') THEN
    RETURN QUERY EXECUTE $f$
      SELECT
        'query'::text,
        s.queryid::text,
        s.temp_blks_read + s.temp_blks_written,
        (s.temp_blks_read + s.temp_blks_written) * 8192,
        s.calls,
        round(s.mean_exec_time::numeric, 2),
        left(s.query, 500),
        CASE
          WHEN (s.temp_blks_read + s.temp_blks_written) * 8192 >= 1::bigint * 1024 * 1024 * 1024 THEN 'critical'
          WHEN (s.temp_blks_read + s.temp_blks_written) * 8192 >= 100 * 1024 * 1024 THEN 'warning'
          ELSE 'info'
        END,
        'Query com spill: revise ORDER BY/GROUP BY, adicione indice cobrindo ordenacao, ou aumente work_mem por sessao.'
      FROM extensions.pg_stat_statements s
      WHERE (s.temp_blks_read + s.temp_blks_written) > 0
        AND s.query NOT ILIKE '%%pg_stat_statements%%'
      ORDER BY (s.temp_blks_read + s.temp_blks_written) DESC
      LIMIT $1
    $f$ USING p_limit;
  END IF;
END;
$function$;

-- 3) 42804: pg_attribute.attname e do tipo "name"; a assinatura declara text[].
CREATE OR REPLACE FUNCTION public.get_unindexed_foreign_keys()
RETURNS TABLE(
  table_name text,
  constraint_name text,
  fk_columns text[],
  referenced_table text,
  table_size_bytes bigint,
  suggested_ddl text,
  severity text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;

  RETURN QUERY
  WITH fks AS (
    SELECT
      c.conrelid::regclass::text AS tbl,
      c.conname AS cname,
      c.conkey AS colnums,
      c.confrelid::regclass::text AS ref_tbl,
      c.conrelid,
      c.confrelid,
      n.nspname AS nsp
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.contype = 'f'
      AND n.nspname = 'public'
  ),
  fk_cols AS (
    SELECT
      f.tbl,
      f.cname,
      f.ref_tbl,
      f.conrelid,
      f.colnums,
      ARRAY(
        SELECT a.attname::text
        FROM unnest(f.colnums) WITH ORDINALITY AS u(attnum, ord)
        JOIN pg_attribute a ON a.attrelid = f.conrelid AND a.attnum = u.attnum
        ORDER BY u.ord
      )::text[] AS col_names
    FROM fks f
  )
  SELECT
    fc.tbl::text,
    fc.cname::text,
    fc.col_names,
    fc.ref_tbl::text,
    pg_total_relation_size(fc.conrelid)::bigint,
    format(
      'CREATE INDEX IF NOT EXISTS idx_%s_%s ON %s (%s);',
      regexp_replace(fc.tbl, '^public\.', ''),
      array_to_string(fc.col_names, '_'),
      fc.tbl,
      array_to_string(fc.col_names, ', ')
    )::text,
    CASE
      WHEN pg_total_relation_size(fc.conrelid) >= 104857600 THEN 'critical'
      WHEN pg_total_relation_size(fc.conrelid) >= 10485760 THEN 'warning'
      ELSE 'info'
    END::text
  FROM fk_cols fc
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_index ix
    WHERE ix.indrelid = fc.conrelid
      AND (ix.indkey::int2[])[0:array_length(fc.colnums, 1)-1] = fc.colnums
  )
  ORDER BY pg_total_relation_size(fc.conrelid) DESC;
END;
$function$;

-- 4) 42883: 1024^3 e double precision; round(double, int) nao existe. Divisor passa a numeric.
CREATE OR REPLACE FUNCTION public.get_capacity_forecast_fast(p_hours_ahead integer DEFAULT 168)
RETURNS TABLE(
  metric text,
  current_value numeric,
  slope_per_hour numeric,
  forecast_value numeric,
  hours_ahead integer,
  threshold numeric,
  hours_until_threshold numeric,
  severity text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT public.has_role(auth.uid(), 'admin') INTO v_is_admin;
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      EXTRACT(EPOCH FROM (s.created_at - (now() - interval '7 days'))) / 3600.0 AS x_hours,
      s.active_connections::numeric AS conn,
      s.db_size_bytes::numeric AS size_b,
      s.created_at
    FROM public.db_health_snapshots s
    WHERE s.created_at >= now() - interval '7 days'
      AND s.active_connections IS NOT NULL
      AND s.db_size_bytes IS NOT NULL
  ),
  stats AS (
    SELECT
      COUNT(*) AS n,
      regr_slope(b.conn, b.x_hours)::numeric  AS slope_conn,
      regr_intercept(b.conn, b.x_hours)::numeric AS icpt_conn,
      regr_slope(b.size_b, b.x_hours)::numeric AS slope_size,
      regr_intercept(b.size_b, b.x_hours)::numeric AS icpt_size,
      MAX(b.x_hours)::numeric AS x_now,
      (SELECT conn FROM base ORDER BY created_at DESC LIMIT 1) AS curr_conn,
      (SELECT size_b FROM base ORDER BY created_at DESC LIMIT 1) AS curr_size
    FROM base b
  ),
  forecasts AS (
    SELECT 'active_connections'::text AS metric,
           st.curr_conn AS current_value,
           COALESCE(st.slope_conn, 0)::numeric AS slope_per_hour,
           COALESCE(st.icpt_conn + st.slope_conn * (st.x_now + p_hours_ahead), st.curr_conn)::numeric AS forecast_value,
           80::numeric AS threshold
    FROM stats st WHERE st.n >= 3
    UNION ALL
    SELECT 'db_size_gb'::text,
           (st.curr_size / 1073741824::numeric),
           (COALESCE(st.slope_size, 0)::numeric / 1073741824::numeric),
           (COALESCE(st.icpt_size + st.slope_size * (st.x_now + p_hours_ahead), st.curr_size)::numeric / 1073741824::numeric),
           8::numeric
    FROM stats st WHERE st.n >= 3
  )
  SELECT
    f.metric,
    ROUND(f.current_value, 2),
    ROUND(f.slope_per_hour, 4),
    ROUND(f.forecast_value, 2),
    p_hours_ahead,
    f.threshold,
    CASE
      WHEN f.slope_per_hour <= 0 THEN NULL
      WHEN f.current_value >= f.threshold THEN 0
      ELSE ROUND((f.threshold - f.current_value) / f.slope_per_hour, 1)
    END AS hours_until_threshold,
    CASE
      WHEN f.current_value >= f.threshold THEN 'critical'
      WHEN f.slope_per_hour > 0 AND (f.threshold - f.current_value) / f.slope_per_hour < 48 THEN 'critical'
      WHEN f.slope_per_hour > 0 AND (f.threshold - f.current_value) / f.slope_per_hour < 168 THEN 'warning'
      ELSE 'ok'
    END AS severity
  FROM forecasts f;
END;
$function$;

-- 5) 42702: o CTE expunha colunas com o mesmo nome dos OUT params; qualificar com alias resolve.
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
$function$;

-- 6) 42883: pg_class.reltuples e real (float4); numeric / real gera double precision.
CREATE OR REPLACE FUNCTION public.get_top_tables_by_size(p_limit integer DEFAULT 30)
RETURNS TABLE(
  schema_name text,
  table_name text,
  total_bytes bigint,
  table_bytes bigint,
  indexes_bytes bigint,
  toast_bytes bigint,
  estimated_rows bigint,
  bytes_per_row numeric,
  severity text,
  recommendation text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  RETURN QUERY
  SELECT
    n.nspname::text,
    c.relname::text,
    pg_total_relation_size(c.oid)::bigint,
    pg_relation_size(c.oid)::bigint,
    COALESCE(pg_indexes_size(c.oid), 0)::bigint,
    COALESCE(pg_total_relation_size(c.reltoastrelid), 0)::bigint,
    c.reltuples::bigint,
    CASE WHEN c.reltuples > 0
      THEN ROUND((pg_relation_size(c.oid)::numeric / c.reltuples::numeric), 1)
      ELSE 0::numeric
    END,
    CASE
      WHEN pg_total_relation_size(c.oid) >= 10::bigint * 1024 * 1024 * 1024 THEN 'critical'
      WHEN pg_total_relation_size(c.oid) >= 1::bigint * 1024 * 1024 * 1024 THEN 'warning'
      WHEN pg_total_relation_size(c.oid) >= 100 * 1024 * 1024 THEN 'info'
      ELSE 'ok'
    END::text,
    CASE
      WHEN pg_total_relation_size(c.oid) >= 10::bigint * 1024 * 1024 * 1024
        THEN 'Considere particionamento por data ou arquivamento em cold storage.'
      WHEN pg_total_relation_size(c.oid) >= 1::bigint * 1024 * 1024 * 1024
        AND COALESCE(pg_indexes_size(c.oid),0) > pg_relation_size(c.oid)
        THEN 'Indices maiores que a tabela - revise duplicados/redundantes.'
      WHEN pg_total_relation_size(c.oid) >= 1::bigint * 1024 * 1024 * 1024
        THEN 'Avalie VACUUM FULL, pg_repack ou retencao de dados historicos.'
      WHEN pg_total_relation_size(c.oid) >= 100 * 1024 * 1024
        THEN 'Monitorar crescimento; sem acao imediata.'
      ELSE 'Tamanho saudavel.'
    END::text
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'
    AND n.nspname = 'public'
  ORDER BY pg_total_relation_size(c.oid) DESC
  LIMIT p_limit;
END;
$function$;

-- 7) 42501: pg_stat_file exige pg_read_server_files, nao concedivel no Supabase gerenciado.
--    pg_ls_waldir() ja devolve a coluna size; se nem ela estiver disponivel, degrada para 'unknown'
--    em vez de derrubar o painel inteiro com 403.
CREATE OR REPLACE FUNCTION public.get_wal_health()
RETURNS TABLE(
  db_size_bytes bigint,
  wal_size_bytes bigint,
  wal_to_db_ratio numeric,
  checkpoint_timeout_s integer,
  max_wal_size_mb integer,
  severity text,
  recommendation text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
DECLARE
  v_db bigint;
  v_wal bigint;
  v_ratio numeric;
  v_ckpt integer;
  v_maxwal integer;
  v_sev text;
  v_reco text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  v_db := pg_database_size(current_database());

  BEGIN
    SELECT COALESCE(sum(w.size), 0)::bigint INTO v_wal FROM pg_ls_waldir() w;
  EXCEPTION WHEN OTHERS THEN
    v_wal := NULL;
  END;

  v_ratio := CASE WHEN v_wal IS NOT NULL AND v_db > 0
    THEN round(v_wal::numeric / v_db, 2) ELSE NULL END;

  BEGIN v_ckpt := current_setting('checkpoint_timeout')::integer;
  EXCEPTION WHEN OTHERS THEN v_ckpt := NULL; END;

  BEGIN v_maxwal := (regexp_replace(current_setting('max_wal_size'),'[^0-9]','','g'))::integer;
  EXCEPTION WHEN OTHERS THEN v_maxwal := NULL; END;

  IF v_ratio IS NULL THEN
    v_sev := 'unknown';
    v_reco := 'Tamanho do WAL indisponivel: o plano gerenciado nao expoe pg_ls_waldir/pg_stat_file a esta role.';
  ELSIF v_ratio > 10 THEN
    v_sev := 'critical';
    v_reco := 'WAL desproporcional (>10x do banco). Verificar replicacao parada, slots inativos ou wal_keep_size excessivo.';
  ELSIF v_ratio > 5 THEN
    v_sev := 'warning';
    v_reco := 'WAL crescendo alem do esperado (>5x). Monitorar checkpoint e slots de replicacao.';
  ELSE
    v_sev := 'ok';
    v_reco := 'Razao WAL/DB dentro do esperado.';
  END IF;

  db_size_bytes := v_db;
  wal_size_bytes := v_wal;
  wal_to_db_ratio := v_ratio;
  checkpoint_timeout_s := v_ckpt;
  max_wal_size_mb := v_maxwal;
  severity := v_sev;
  recommendation := v_reco;
  RETURN NEXT;
END;
$function$;

-- 8) 42702: deadlocks/temp_files/temp_bytes sao OUT params e colunas de pg_stat_database.
CREATE OR REPLACE FUNCTION public.get_transaction_health()
RETURNS TABLE(
  total_commits bigint,
  total_rollbacks bigint,
  rollback_ratio_pct numeric,
  deadlocks bigint,
  temp_files bigint,
  temp_bytes bigint,
  stats_since timestamptz,
  hours_since_reset numeric,
  rollbacks_per_hour numeric,
  severity text,
  recommendation text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
DECLARE
  v_hours numeric;
  v_rate numeric;
  v_sev text;
  v_reco text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT
    COALESCE(sum(d.xact_commit),0),
    COALESCE(sum(d.xact_rollback),0),
    COALESCE(sum(d.deadlocks),0),
    COALESCE(sum(d.temp_files),0),
    COALESCE(sum(d.temp_bytes),0),
    min(d.stats_reset)
  INTO
    total_commits, total_rollbacks, deadlocks, temp_files, temp_bytes, stats_since
  FROM pg_stat_database d
  WHERE d.datname = current_database();

  v_hours := GREATEST(EXTRACT(EPOCH FROM (now() - stats_since))/3600.0, 0.01);
  hours_since_reset := round(v_hours::numeric, 2);
  v_rate := total_rollbacks::numeric / v_hours;
  rollbacks_per_hour := round(v_rate, 2);
  rollback_ratio_pct := CASE WHEN (total_commits+total_rollbacks)>0
    THEN round(100.0 * total_rollbacks / (total_commits+total_rollbacks), 3)
    ELSE 0 END;

  IF v_rate > 100 THEN
    v_sev := 'critical';
    v_reco := 'Taxa alta de rollbacks. Investigar policies RLS, triggers e conflitos de aplicacao em edge functions.';
  ELSIF v_rate > 20 THEN
    v_sev := 'warning';
    v_reco := 'Rollbacks elevados. Monitorar tendencia e revisar mutations recentes.';
  ELSE
    v_sev := 'ok';
    v_reco := 'Taxa de rollbacks dentro do esperado.';
  END IF;

  severity := v_sev;
  recommendation := v_reco;
  RETURN NEXT;
END;
$function$;

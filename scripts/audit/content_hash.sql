-- Hash de conteúdo por tabela — para verificar paridade de dados
-- Executar nos dois bancos após carga; deve retornar hashes iguais
-- Mesmo algoritmo de manifest_data.sql: md5 por linha, agregado na ordem do próprio md5 — o resultado não
-- depende da ordem física/de inserção das linhas. Tabela vazia = hash ''. Partições entram pela tabela-mãe.
-- Idempotente: CREATE TEMP TABLE + INSERT + SELECT final + DROP (padrão de manifest_detail.sql).
-- Limites: jsonb_strip_nulls também ignora chave com null DENTRO de coluna json/jsonb; custo = 1 seq scan
-- por tabela + ~32 bytes de memória por linha (string_agg estoura perto de 33 milhões de linhas) — tabela
-- desse porte vai para a lista de exclusão abaixo e é comparada à parte, por faixa de id.

-- Sobra de execução interrompida na mesma sessão: sem este DROP o CREATE falha e, com o psql no modo
-- padrão (segue após erro), as linhas velhas saem misturadas na saída nova.
DROP TABLE IF EXISTS pg_temp._content_hash;
CREATE TEMP TABLE _content_hash (tablename text, row_count bigint, content_hash text);

DO $$
DECLARE
  r record;
BEGIN
  -- to_jsonb(...)::text muda com estes parâmetros de sessão; fixados (só nesta transação) para os dois
  -- bancos produzirem o mesmo texto. row_security=off: se RLS esconderia linhas do role corrente, falha
  -- em vez de devolver hash parcial.
  PERFORM set_config('TimeZone', 'UTC', true), set_config('IntervalStyle', 'postgres', true),
          set_config('extra_float_digits', '1', true), set_config('bytea_output', 'hex', true),
          set_config('row_security', 'off', true);
  FOR r IN
    SELECT c.relname
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind IN ('r','p') AND NOT c.relispartition
       AND c.relname NOT IN ('audit_logs','system_heartbeat','cron_job_run_details')
  LOOP
    BEGIN
      EXECUTE format(
        'INSERT INTO pg_temp._content_hash
         SELECT %L, count(*), coalesce(md5(string_agg(x, '''' ORDER BY x COLLATE "C")), '''')
           FROM (SELECT md5(jsonb_strip_nulls(to_jsonb(t))::text) AS x FROM public.%I t) s',
        r.relname, r.relname);
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'content_hash: falha em public.%: %', r.relname, SQLERRM USING ERRCODE = SQLSTATE;
    END;
  END LOOP;
END
$$;

SELECT tablename, row_count, content_hash FROM _content_hash ORDER BY tablename;

DROP TABLE pg_temp._content_hash;

-- Uma tabela só (mesmo hash da linha correspondente acima, em sessão com TimeZone=UTC):
-- SELECT count(*), coalesce(md5(string_agg(x, '' ORDER BY x COLLATE "C")), '')
--   FROM (SELECT md5(jsonb_strip_nulls(to_jsonb(r))::text) AS x FROM public.<tabela> r) s;

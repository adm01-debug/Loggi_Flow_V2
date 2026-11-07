-- Hash de conteúdo por tabela — para verificar paridade de dados
-- Executar nos dois bancos após carga; deve retornar hashes iguais.
--
-- FIX: a versão anterior usava `to_jsonb(t)` (alias inexistente) e um
-- `CROSS JOIN LATERAL (... LIMIT 0)` que zerava o resultado. Reescrito com
-- SQL dinâmico (plpgsql) que itera as tabelas public e calcula o hash real
-- de cada uma, com o mesmo algoritmo da "versão segura" comentada abaixo.
CREATE TEMP TABLE _content_hash (tablename text, row_count bigint, content_hash text);

DO $$
DECLARE
  r record;
  _count bigint;
  _hash text;
BEGIN
  FOR r IN
    SELECT tablename
      FROM pg_tables
     WHERE schemaname = 'public'
       AND tablename NOT IN ('audit_logs','system_heartbeat','cron_job_run_details')
     ORDER BY tablename
  LOOP
    EXECUTE format(
      'SELECT count(*), md5(string_agg(md5(jsonb_strip_nulls(to_jsonb(t))::text), '''' ORDER BY 1)) FROM public.%I t',
      r.tablename
    ) INTO _count, _hash;
    INSERT INTO _content_hash VALUES (r.tablename, _count, _hash);
  END LOOP;
END
$$;

SELECT tablename, row_count, content_hash FROM _content_hash ORDER BY tablename;

DROP TABLE _content_hash;

-- Versão segura: executar por tabela individualmente:
-- SELECT count(*), md5(string_agg(md5(jsonb_strip_nulls(to_jsonb(r))::text), '' ORDER BY id::text)) FROM public.<tabela> r;
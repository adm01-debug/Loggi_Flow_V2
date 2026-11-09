-- Manifesto de auditoria — dados (rows + hash de conteúdo) por tabela public/internal
-- Saída única: (section, key, def) no padrão do pipeline audit_tmp.manifest
-- Idempotente: CREATE TEMP TABLE + INSERT + SELECT final + DROP.

-- Sobra de execução interrompida na mesma sessão: sem este DROP o CREATE falha e, com o psql no modo
-- padrão (segue após erro), as linhas velhas saem misturadas no manifesto novo.
DROP TABLE IF EXISTS pg_temp._manifest_data;
CREATE TEMP TABLE _manifest_data (section text, key text, def text);

INSERT INTO _manifest_data
SELECT 'data'::text AS section, n.nspname||'.'||c.relname AS key,
  'rows='||(xpath('/row/n/text()', query_to_xml(format('select count(*) as n from %I.%I', n.nspname, c.relname), false, true, '')))[1]::text
  ||' hash='||coalesce((xpath('/row/h/text()', query_to_xml(format('select md5(string_agg(x, '''' order by x)) as h from (select md5(jsonb_strip_nulls(to_jsonb(t))::text) as x from %I.%I t) s', n.nspname, c.relname), false, true, '')))[1]::text,'') AS def
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname IN ('public','internal') AND c.relkind IN ('r','p') AND NOT c.relispartition;

SELECT section, key, def FROM _manifest_data ORDER BY section, key;

DROP TABLE _manifest_data;

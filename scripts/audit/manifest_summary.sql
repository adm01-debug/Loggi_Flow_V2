-- Manifesto de auditoria — resumo por seção
-- Executar nos dois bancos e comparar saídas
-- Idempotente: CREATE TEMP TABLE + INSERT + SELECT final + DROP (padrão de manifest_detail.sql).
-- total NULL em cron_jobs = pg_cron não instalado neste banco (diferente de 0 jobs).

-- Sobra de execução interrompida na mesma sessão: sem este DROP o CREATE falha e, com o psql no modo
-- padrão (segue após erro), as linhas velhas saem misturadas no resumo novo.
DROP TABLE IF EXISTS pg_temp._manifest_summary;
CREATE TEMP TABLE _manifest_summary (section text, total bigint);

INSERT INTO _manifest_summary
SELECT 'tables' AS section, count(*) AS total
  FROM pg_tables WHERE schemaname = 'public'
UNION ALL
SELECT 'columns', count(*)
  FROM information_schema.columns WHERE table_schema = 'public'
UNION ALL
SELECT 'indexes', count(*)
  FROM pg_indexes WHERE schemaname = 'public'
UNION ALL
SELECT 'policies', count(*)
  FROM pg_policies WHERE schemaname = 'public'
UNION ALL
SELECT 'functions', count(*)
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind IN ('f','p')
UNION ALL
SELECT 'triggers', count(*)
  FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND NOT t.tgisinternal
UNION ALL
SELECT 'migrations', count(*) FROM supabase_migrations.schema_migrations
UNION ALL
SELECT 'storage_buckets', count(*) FROM storage.buckets;

-- pg_cron pode não estar instalado; trata a ausência sem quebrar o manifesto
DO $$
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    INSERT INTO _manifest_summary SELECT 'cron_jobs', count(*) FROM cron.job;
  ELSE
    INSERT INTO _manifest_summary VALUES ('cron_jobs', NULL);
  END IF;
END
$$;

SELECT section, total FROM _manifest_summary ORDER BY section COLLATE "C";

DROP TABLE pg_temp._manifest_summary;

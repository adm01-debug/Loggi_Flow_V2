-- Manifesto de auditoria — resumo por seção
-- Executar nos dois bancos e comparar saídas
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
SELECT 'cron_jobs', count(*) FROM cron.job
UNION ALL
SELECT 'migrations', count(*) FROM supabase_migrations.schema_migrations
UNION ALL
SELECT 'storage_buckets', count(*) FROM storage.buckets
ORDER BY section;

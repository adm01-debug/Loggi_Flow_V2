-- Hash de conteúdo por tabela — para verificar paridade de dados
-- Executar nos dois bancos após carga; deve retornar hashes iguais
SELECT tablename,
       count(*) AS row_count,
       md5(string_agg(md5(jsonb_strip_nulls(to_jsonb(t))::text), '' ORDER BY 1)) AS content_hash
  FROM pg_tables
  CROSS JOIN LATERAL (SELECT * FROM information_schema.tables WHERE table_name = tablename AND table_schema = 'public' LIMIT 0) dummy
  WHERE schemaname = 'public'
    AND tablename NOT IN ('audit_logs','system_heartbeat','cron_job_run_details')
  GROUP BY tablename
  ORDER BY tablename;

-- Versão segura: executar por tabela individualmente:
-- SELECT count(*), md5(string_agg(md5(jsonb_strip_nulls(to_jsonb(r))::text), '' ORDER BY id::text)) FROM public.<tabela> r;

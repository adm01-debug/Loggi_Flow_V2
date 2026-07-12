-- Sprint 26 (fix) — Autovacuum tuning + estatísticas ampliadas
-- audit_logs é particionada: storage params vão nas partições folha.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relkind = 'r'
       AND c.relname LIKE 'audit_logs_y%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02)',
      r.relname
    );
  END LOOP;
END $$;

-- Tabelas não particionadas de alta escrita
ALTER TABLE public.notifications      SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.telemetry_logs     SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.rate_limit_logs    SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.login_attempts     SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.security_events    SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.query_telemetry    SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.bio_sync_telemetry SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE public.nexus_tactical_logs SET (autovacuum_vacuum_scale_factor = 0.05, autovacuum_analyze_scale_factor = 0.02);

-- Estatísticas ampliadas em colunas críticas (funciona em tabelas particionadas)
ALTER TABLE public.entregas ALTER COLUMN status SET STATISTICS 500;
ALTER TABLE public.entregas ALTER COLUMN transportadora_id SET STATISTICS 500;
ALTER TABLE public.entregas ALTER COLUMN cliente_id SET STATISTICS 500;
ALTER TABLE public.coletas  ALTER COLUMN status SET STATISTICS 500;
ALTER TABLE public.coletas  ALTER COLUMN transportadora_id SET STATISTICS 500;
ALTER TABLE public.notifications ALTER COLUMN user_id SET STATISTICS 500;
ALTER TABLE public.audit_logs ALTER COLUMN table_name SET STATISTICS 500;
ALTER TABLE public.audit_logs ALTER COLUMN action SET STATISTICS 300;

ANALYZE public.entregas;
ANALYZE public.coletas;
ANALYZE public.notifications;
ANALYZE public.audit_logs;
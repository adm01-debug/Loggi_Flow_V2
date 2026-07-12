-- Sprint 28 — TOAST compression LZ4 em colunas grandes
ALTER TABLE public.notifications        ALTER COLUMN metadata      SET COMPRESSION lz4;
ALTER TABLE public.nexus_tactical_logs  ALTER COLUMN message       SET COMPRESSION lz4;
ALTER TABLE public.webhook_deliveries   ALTER COLUMN payload       SET COMPRESSION lz4;
ALTER TABLE public.query_telemetry      ALTER COLUMN error_message SET COMPRESSION lz4;

-- audit_logs é particionada: aplicar em cada partição folha
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relname LIKE 'audit_logs_y%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN old_data SET COMPRESSION lz4', r.relname);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN new_data SET COMPRESSION lz4', r.relname);
  END LOOP;
END $$;

ANALYZE public.notifications;
ANALYZE public.nexus_tactical_logs;
ANALYZE public.webhook_deliveries;
ANALYZE public.query_telemetry;
ANALYZE public.audit_logs;
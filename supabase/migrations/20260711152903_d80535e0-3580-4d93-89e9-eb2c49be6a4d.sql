
-- Enable pg_cron + pg_net for scheduled maintenance
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================
-- P4: Automatic partition retention for audit_logs & rastreamento_historico
-- Keep 18 months of audit_logs, 12 months of rastreamento_historico
-- ============================================================
CREATE OR REPLACE FUNCTION public.drop_old_partitions(
  p_parent_table text,
  p_prefix text,
  p_months_to_keep int
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  r record;
  cutoff date := (date_trunc('month', now()) - (p_months_to_keep || ' months')::interval)::date;
  dropped int := 0;
  yr int; mo int;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname LIKE p_prefix || '%'
  LOOP
    -- Extract year/month from suffix like y2024_m12 or y2024m12
    BEGIN
      yr := substring(r.relname from 'y(\d{4})')::int;
      mo := substring(r.relname from 'm(\d{2})')::int;
      IF make_date(yr, mo, 1) < cutoff THEN
        EXECUTE format('DROP TABLE IF EXISTS public.%I', r.relname);
        dropped := dropped + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN CONTINUE;
    END;
  END LOOP;
  RETURN dropped;
END;
$$;

REVOKE ALL ON FUNCTION public.drop_old_partitions(text, text, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.drop_old_partitions(text, text, int) TO service_role;

-- ============================================================
-- P19: TTL for notifications — hard delete after 90 days
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications(days_to_keep int DEFAULT 90)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE deleted int;
BEGIN
  DELETE FROM public.notifications
   WHERE created_at < now() - (days_to_keep || ' days')::interval;
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END;
$$;
REVOKE ALL ON FUNCTION public.cleanup_old_notifications(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_notifications(int) TO service_role;

-- ============================================================
-- Schedule via pg_cron (idempotent unschedule/reschedule)
-- ============================================================
DO $$
BEGIN
  -- Retention: monthly at 03:00 UTC on day 1
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'nexus_partition_retention';
  PERFORM cron.schedule(
    'nexus_partition_retention',
    '0 3 1 * *',
    $CRON$
      SELECT public.drop_old_partitions('audit_logs', 'audit_logs_', 18);
      SELECT public.drop_old_partitions('rastreamento_historico', 'rastreamento_historico_', 12);
    $CRON$
  );

  -- Telemetry cleanup: daily at 04:00 UTC
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'nexus_telemetry_cleanup';
  PERFORM cron.schedule(
    'nexus_telemetry_cleanup',
    '0 4 * * *',
    $CRON$ SELECT public.cleanup_old_telemetry_logs(30); $CRON$
  );

  -- Notifications TTL: weekly Sunday 05:00 UTC
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'nexus_notifications_ttl';
  PERFORM cron.schedule(
    'nexus_notifications_ttl',
    '0 5 * * 0',
    $CRON$ SELECT public.cleanup_old_notifications(90); $CRON$
  );
END $$;

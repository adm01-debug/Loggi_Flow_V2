
-- ================================
-- SPRINT 22: pg_cron scheduling
-- ================================

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Remove pre-existing jobs (idempotent)
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT jobname FROM cron.job WHERE jobname IN (
    'refresh-dashboard-views-5m',
    'cleanup-telemetry-daily',
    'cleanup-notifications-weekly',
    'ensure-future-partitions-monthly',
    'system-heartbeat-1m'
  ) LOOP
    PERFORM cron.unschedule(r.jobname);
  END LOOP;
END $$;

-- 1. Refresh dashboards every 5 minutes
SELECT cron.schedule(
  'refresh-dashboard-views-5m',
  '*/5 * * * *',
  $$ SELECT public.refresh_dashboard_views(); $$
);

-- 2. Cleanup old telemetry daily at 03:00
SELECT cron.schedule(
  'cleanup-telemetry-daily',
  '0 3 * * *',
  $$ SELECT public.cleanup_old_telemetry_logs(30); $$
);

-- 3. Cleanup old notifications weekly (Sunday 04:00)
SELECT cron.schedule(
  'cleanup-notifications-weekly',
  '0 4 * * 0',
  $$ SELECT public.cleanup_old_notifications(90); $$
);

-- 4. Ensure future partitions monthly (day 1 at 02:00)
SELECT cron.schedule(
  'ensure-future-partitions-monthly',
  '0 2 1 * *',
  $$ SELECT public.ensure_future_partitions(); $$
);

-- 5. System heartbeat every minute
SELECT cron.schedule(
  'system-heartbeat-1m',
  '* * * * *',
  $$ SELECT public.record_heartbeat(); $$
);

-- Migration: 20260901000000_cron_jobs_canonical
-- Versiona todos os 25 cron jobs do destino de forma idempotente.
-- Jobs de Edge Function usam vault.decrypted_secrets ('anon_key', 'project_url').
-- Etapa 52 do plano de migração (issue #35). Vault populado na etapa 47.

-- ─── UNSCHEDULE (idempotente) ───────────────────────────────────────────────
DO $$
DECLARE _j text;
BEGIN
  FOR _j IN SELECT unnest(ARRAY[
    'accuracy-meta-monitor-daily','accuracy-weekly-digest-monday',
    'auto-revert-ineffective-indexes-daily','check-health-score-regression-hourly',
    'cleanup-cron-job-run-details','cleanup-health-snapshots-daily',
    'cleanup-notifications-weekly','cleanup-old-delay-predictions',
    'cleanup-telemetry-daily','compute-db-slo-daily',
    'db-health-snapshot-hourly','db-health-weekly-report',
    'db-regression-monitor-15m','ensure-future-partitions-monthly',
    'nexus_partition_retention','nexus_slow_queries',
    'persist-global-health-score-daily','predict-delays-every-30min',
    'refresh-dashboard-views-5m','reindex-hot-indexes-weekly',
    'rte-gateway-health-check','rte-gateway-health-purge',
    'rte-slo-daily-rollup','snapshot-query-baseline-daily',
    'system-heartbeat-1m'
  ]) LOOP
    PERFORM cron.unschedule(_j) WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname=_j);
  END LOOP;
END $$;

-- ─── JOBS PG-ONLY (sem vault) ────────────────────────────────────────────────
SELECT cron.schedule('cleanup-notifications-weekly',        '0 4 * * 0',    $$ SELECT public.cleanup_old_notifications(90); $$);
SELECT cron.schedule('cleanup-telemetry-daily',             '0 3 * * *',    $$ SELECT public.cleanup_old_telemetry_logs(30); $$);
SELECT cron.schedule('ensure-future-partitions-monthly',    '0 2 1 * *',    $$ SELECT public.ensure_future_partitions(); $$);
SELECT cron.schedule('nexus_partition_retention',           '0 3 1 * *',    $$ SELECT public.drop_old_partitions('audit_logs','audit_logs_',18); SELECT public.drop_old_partitions('rastreamento_historico','rastreamento_historico_',12); $$);
SELECT cron.schedule('nexus_slow_queries',                  '0 6 * * *',    $$ SELECT public.alert_slow_queries(500); $$);
SELECT cron.schedule('persist-global-health-score-daily',   '0 6 * * *',    $$ SELECT public.persist_global_health_score(); $$);
SELECT cron.schedule('refresh-dashboard-views-5m',          '*/5 * * * *',  $$ SELECT public.refresh_dashboard_views(); $$);
SELECT cron.schedule('system-heartbeat-1m',                 '* * * * *',    $$ SELECT public.record_heartbeat(); $$);
SELECT cron.schedule('auto-revert-ineffective-indexes-daily','30 4 * * *',   $$ SELECT public.auto_revert_ineffective_indexes(24,5); $$);
SELECT cron.schedule('check-health-score-regression-hourly','15 * * * *',    $$ SELECT public.check_and_alert_health_regression(); $$);
SELECT cron.schedule('reindex-hot-indexes-weekly',          '0 5 * * 0',    $$ SELECT internal.reindex_hot_indexes(); $$);
SELECT cron.schedule('snapshot-query-baseline-daily',       '30 4 * * *',   $$ SELECT internal.snapshot_query_baseline(); $$);
SELECT cron.schedule('cleanup-cron-job-run-details',        '30 2 * * *',   $$ DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days'; $$);
SELECT cron.schedule('cleanup-health-snapshots-daily',      '30 3 * * *',   $$ SELECT public.cleanup_old_health_snapshots(30); $$);
SELECT cron.schedule('compute-db-slo-daily',                '15 3 * * *',   $$ SELECT public.compute_db_slo_for((now() - interval '1 day')::date); $$);
SELECT cron.schedule('cleanup-old-delay-predictions',       '0 3 * * *',    $$ SELECT public.cleanup_old_delay_predictions(); $$);
SELECT cron.schedule('rte-gateway-health-purge',            '20 3 * * *',   $$ SELECT public.purge_rte_gateway_health(30); $$);
SELECT cron.schedule('rte-slo-daily-rollup',                '20 0 * * *',   $$ SELECT public.rte_rollup_slo_daily(((now() AT TIME ZONE 'utc')::date - 1)), public.rte_rollup_slo_daily((now() AT TIME ZONE 'utc')::date); $$);

-- ─── JOBS EDGE FUNCTION (leem anon_key e project_url do vault) ──────────────
-- Requer: vault.secrets com name IN ('anon_key','project_url') — etapa 47
SELECT cron.schedule('db-regression-monitor-15m', '*/15 * * * *', $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='project_url') || '/functions/v1/db-regression-monitor',
    headers := json_build_object('Content-Type','application/json','apikey',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='anon_key'))::jsonb,
    body := '{}'::jsonb
  );
$cron$);

SELECT cron.schedule('db-health-snapshot-hourly', '0 * * * *', $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='project_url') || '/functions/v1/db-health-snapshot?persist=true',
    headers := json_build_object('Content-Type','application/json','apikey',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='anon_key'))::jsonb,
    body := '{}'::jsonb
  );
$cron$);

SELECT cron.schedule('db-health-weekly-report', '0 8 * * 1', $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='project_url') || '/functions/v1/db-health-weekly-report',
    headers := json_build_object('Content-Type','application/json','apikey',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='anon_key'))::jsonb,
    body := concat('{"time":"', now(), '"}')::jsonb
  );
$cron$);

SELECT cron.schedule('predict-delays-every-30min', '*/30 * * * *', $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='project_url') || '/functions/v1/predict-delays-scheduled',
    headers := json_build_object('Content-Type','application/json','apikey',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='anon_key'))::jsonb,
    body := '{}'::jsonb
  );
$cron$);

SELECT cron.schedule('accuracy-meta-monitor-daily', '15 8 * * *', $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='project_url') || '/functions/v1/accuracy-meta-monitor',
    headers := json_build_object('Content-Type','application/json','apikey',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='anon_key'))::jsonb,
    body := '{}'::jsonb
  );
$cron$);

SELECT cron.schedule('accuracy-weekly-digest-monday', '0 9 * * 1', $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='project_url') || '/functions/v1/accuracy-weekly-digest',
    headers := json_build_object('Content-Type','application/json','apikey',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='anon_key'))::jsonb,
    body := jsonb_build_object('trigger','cron','at',now()::text)
  );
$cron$);

SELECT cron.schedule('rte-gateway-health-check', '*/15 * * * *', $cron$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='project_url') || '/functions/v1/rodonaves-api',
    headers := json_build_object('Content-Type','application/json','apikey',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='anon_key'))::jsonb,
    body := '{"action":"health-all","persist":true}'::jsonb
  );
$cron$);

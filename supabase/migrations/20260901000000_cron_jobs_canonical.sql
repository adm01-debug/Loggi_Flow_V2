-- Migration: 20260901000000_cron_jobs_canonical
-- Versiona todos os cron jobs do destino de forma idempotente.
-- Usa vault para a anon_key (nunca hardcoded).
-- Etapa 52 do plano de migração (issue #35)

-- Jobs que chamam funções PG direto (sem vault)
SELECT cron.unschedule('cleanup-notifications-weekly')   WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='cleanup-notifications-weekly');
SELECT cron.unschedule('cleanup-telemetry-daily')         WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='cleanup-telemetry-daily');
SELECT cron.unschedule('ensure-future-partitions-monthly') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='ensure-future-partitions-monthly');
SELECT cron.unschedule('nexus_partition_retention')       WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='nexus_partition_retention');
SELECT cron.unschedule('nexus_slow_queries')              WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='nexus_slow_queries');
SELECT cron.unschedule('persist-global-health-score-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='persist-global-health-score-daily');
SELECT cron.unschedule('refresh-dashboard-views-5m')      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='refresh-dashboard-views-5m');
SELECT cron.unschedule('system-heartbeat-1m')             WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='system-heartbeat-1m');
SELECT cron.unschedule('auto-revert-ineffective-indexes-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='auto-revert-ineffective-indexes-daily');
SELECT cron.unschedule('check-health-score-regression-hourly') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='check-health-score-regression-hourly');
SELECT cron.unschedule('reindex-hot-indexes-weekly')      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='reindex-hot-indexes-weekly');
SELECT cron.unschedule('snapshot-query-baseline-daily')   WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='snapshot-query-baseline-daily');
SELECT cron.unschedule('cleanup-cron-job-run-details')    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='cleanup-cron-job-run-details');
-- Jobs que chamam Edge Functions (precisam de anon_key do vault)
SELECT cron.unschedule('db-regression-monitor-15m')  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='db-regression-monitor-15m');
SELECT cron.unschedule('db-health-snapshot-hourly')  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='db-health-snapshot-hourly');
SELECT cron.unschedule('cleanup-health-snapshots-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='cleanup-health-snapshots-daily');
SELECT cron.unschedule('compute-db-slo-daily')        WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='compute-db-slo-daily');
SELECT cron.unschedule('db-health-weekly-report')     WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='db-health-weekly-report');
SELECT cron.unschedule('predict-delays-every-30min')  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='predict-delays-every-30min');
SELECT cron.unschedule('cleanup-old-delay-predictions') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='cleanup-old-delay-predictions');
SELECT cron.unschedule('accuracy-meta-monitor-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='accuracy-meta-monitor-daily');
SELECT cron.unschedule('accuracy-weekly-digest-monday') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='accuracy-weekly-digest-monday');
SELECT cron.unschedule('rte-gateway-health-check')    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='rte-gateway-health-check');
SELECT cron.unschedule('rte-gateway-health-purge')    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='rte-gateway-health-purge');
SELECT cron.unschedule('rte-slo-daily-rollup')        WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='rte-slo-daily-rollup');

-- Recriar jobs PG-only
SELECT cron.schedule('cleanup-notifications-weekly',   '0 4 * * 0',   $$ SELECT public.cleanup_old_notifications(90); $$);
SELECT cron.schedule('cleanup-telemetry-daily',         '0 3 * * *',   $$ SELECT public.cleanup_old_telemetry_logs(30); $$);
SELECT cron.schedule('ensure-future-partitions-monthly','0 2 1 * *',   $$ SELECT public.ensure_future_partitions(); $$);
SELECT cron.schedule('nexus_partition_retention',       '0 3 1 * *',   $$ SELECT public.drop_old_partitions('audit_logs','audit_logs_',18); SELECT public.drop_old_partitions('rastreamento_historico','rastreamento_historico_',12); $$);
SELECT cron.schedule('nexus_slow_queries',              '0 6 * * *',   $$ SELECT public.alert_slow_queries(500); $$);
SELECT cron.schedule('persist-global-health-score-daily','0 6 * * *',  $$ SELECT public.persist_global_health_score(); $$);
SELECT cron.schedule('refresh-dashboard-views-5m',      '*/5 * * * *', $$ SELECT public.refresh_dashboard_views(); $$);
SELECT cron.schedule('system-heartbeat-1m',             '* * * * *',   $$ SELECT public.record_heartbeat(); $$);
SELECT cron.schedule('auto-revert-ineffective-indexes-daily','30 4 * * *', $$ SELECT public.auto_revert_ineffective_indexes(24,5); $$);
SELECT cron.schedule('check-health-score-regression-hourly','15 * * * *',  $$ SELECT public.check_and_alert_health_regression(); $$);
SELECT cron.schedule('reindex-hot-indexes-weekly',      '0 5 * * 0',   $$ SELECT internal.reindex_hot_indexes(); $$);
SELECT cron.schedule('snapshot-query-baseline-daily',   '30 4 * * *',  $$ SELECT internal.snapshot_query_baseline(); $$);
SELECT cron.schedule('cleanup-cron-job-run-details',    '30 2 * * *',  $$ DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days'; $$);
SELECT cron.schedule('cleanup-health-snapshots-daily',  '30 3 * * *',  $$ SELECT public.cleanup_old_health_snapshots(30); $$);
SELECT cron.schedule('compute-db-slo-daily',            '15 3 * * *',  $$ SELECT public.compute_db_slo_for((now() - interval ''1 day'')::date); $$);
SELECT cron.schedule('cleanup-old-delay-predictions',   '0 3 * * *',   $$ SELECT public.cleanup_old_delay_predictions(); $$);
SELECT cron.schedule('rte-gateway-health-purge',        '20 3 * * *',  $$ SELECT public.purge_rte_gateway_health(30); $$);
SELECT cron.schedule('rte-slo-daily-rollup',            '20 0 * * *',  $$ SELECT public.rte_rollup_slo_daily(((now() AT TIME ZONE 'utc')::date - 1)), public.rte_rollup_slo_daily((now() AT TIME ZONE 'utc')::date); $$);

-- Jobs que precisam de anon_key do vault — usar após vault estar populado (etapa 47)
-- SELECT cron.schedule('db-regression-monitor-15m','*/15 * * * *', format(
--   $q$SELECT net.http_post(url:='https://jvfhclubfpxrtrrazrgr.supabase.co/functions/v1/db-regression-monitor',
--            headers:=json_build_object('Content-Type','application/json','apikey',%L)::jsonb, body:='{}'::jsonb)$q$,
--   (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='anon_key')));
-- (Repetir para db-health-snapshot-hourly, db-health-weekly-report, predict-delays-every-30min,
--  accuracy-meta-monitor-daily, accuracy-weekly-digest-monday, rte-gateway-health-check)

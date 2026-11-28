# Views


## audit_tmp.diff (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | audit_tmp.manifest |
| populada | n/a |
| comentário |  |


```sql
SELECT COALESCE(s.section, d.section) AS section,
    COALESCE(s.key, d.key) AS key,
        CASE
            WHEN s.key IS NULL THEN 'ONLY_DST'::text
            WHEN d.key IS NULL THEN 'ONLY_SRC'::text
            WHEN s.def = d.def THEN 'SAME'::text
            ELSE 'DIFF'::text
        END AS status,
    s.def AS src_def,
    d.def AS dst_def
   FROM ( SELECT manifest.section,
            manifest.key,
            manifest.def
           FROM audit_tmp.manifest
          WHERE manifest.side = 'src'::text) s
     FULL JOIN ( SELECT manifest.section,
            manifest.key,
            manifest.def
           FROM audit_tmp.manifest
          WHERE manifest.side = 'dst'::text) d ON s.section = d.section AND s.key = d.key;
```

## audit_tmp.v_migration_status (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | não |
| opções |  |
| depende de | audit_tmp.diff, audit_tmp.load_log, auth.users, cron.job, cron.job_run_details, pg_catalog.pg_publication_tables, supabase_migrations.migration_log, vault.secrets |
| populada | n/a |
| comentário |  |


```sql
SELECT 'data_tables_same'::text AS metric,
    count(*)::text AS value
   FROM audit_tmp.diff
  WHERE diff.section = 'data'::text AND diff.status = 'SAME'::text
UNION ALL
 SELECT 'data_tables_differ'::text AS metric,
    count(*)::text AS value
   FROM audit_tmp.diff
  WHERE diff.section = 'data'::text AND diff.status <> 'SAME'::text
UNION ALL
 SELECT 'auth_users'::text AS metric,
    string_agg(users.email::text, ','::text) AS value
   FROM auth.users
UNION ALL
 SELECT 'cron_jobs_active'::text AS metric,
    count(*)::text AS value
   FROM cron.job
  WHERE job.active
UNION ALL
 SELECT 'cron_failures_24h'::text AS metric,
    count(*)::text AS value
   FROM cron.job_run_details
  WHERE job_run_details.status = 'failed'::text AND job_run_details.start_time > (now() - '24:00:00'::interval)
UNION ALL
 SELECT 'cron_failing_jobs_24h'::text AS metric,
    COALESCE(string_agg(DISTINCT j.jobname, ','::text), '-'::text) AS value
   FROM cron.job_run_details d
     JOIN cron.job j ON j.jobid = d.jobid
  WHERE d.status = 'failed'::text AND d.start_time > (now() - '24:00:00'::interval)
UNION ALL
 SELECT 'delta_last_load'::text AS metric,
    COALESCE(max(load_log.at)::text, '-'::text) AS value
   FROM audit_tmp.load_log
  WHERE load_log.name ~~ 'd:%'::text
UNION ALL
 SELECT 'vault_secrets'::text AS metric,
    string_agg(secrets.name, ','::text) AS value
   FROM vault.secrets
UNION ALL
 SELECT 'duplicate_index_pairs'::text AS metric,
    count(*)::text AS value
   FROM ( SELECT 1 AS "?column?"
           FROM pg_index i
             JOIN pg_class ic ON ic.oid = i.indexrelid
             JOIN pg_class c ON c.oid = i.indrelid
             JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public'::name AND NOT c.relispartition
          GROUP BY c.relname, i.indkey, i.indclass, i.indpred, i.indexprs, ic.relam
         HAVING count(*) > 1) x
UNION ALL
 SELECT 'realtime_tables'::text AS metric,
    string_agg(pg_publication_tables.tablename::text, ','::text) AS value
   FROM pg_publication_tables
  WHERE pg_publication_tables.pubname = 'supabase_realtime'::name
UNION ALL
 SELECT 'migration_log_ok'::text AS metric,
    count(*)::text AS value
   FROM supabase_migrations.migration_log
  WHERE migration_log.status = 'ok'::text;
```

## public.v_prediction_accuracy (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.delay_predictions_history |
| populada | n/a |
| comentário |  |


```sql
SELECT date_trunc('day'::text, predicted_at)::date AS dia,
    risco,
    count(*) FILTER (WHERE confirmed_at IS NOT NULL) AS total_confirmadas,
    count(*) FILTER (WHERE was_accurate = true) AS total_acertos,
    round(count(*) FILTER (WHERE was_accurate = true)::numeric / NULLIF(count(*) FILTER (WHERE confirmed_at IS NOT NULL), 0)::numeric * 100::numeric, 2) AS acuracia_percentual,
    count(*) AS total_predicoes
   FROM delay_predictions_history
  GROUP BY (date_trunc('day'::text, predicted_at)::date), risco;
```

## public.v_prediction_accuracy_by_carrier (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.delay_predictions_history |
| populada | n/a |
| comentário |  |


```sql
SELECT COALESCE(transportadora, 'Sem transportadora'::text) AS transportadora,
    risco,
    count(*) AS total_predicoes,
    count(*) FILTER (WHERE confirmed_at IS NOT NULL) AS total_confirmadas,
    count(*) FILTER (WHERE was_accurate = true) AS total_acertos,
    round(100.0 * count(*) FILTER (WHERE was_accurate = true)::numeric / NULLIF(count(*) FILTER (WHERE confirmed_at IS NOT NULL), 0)::numeric, 1) AS acuracia_percentual,
    round(avg(abs(actual_delay_hours - horas_estimadas_atraso)) FILTER (WHERE confirmed_at IS NOT NULL), 2) AS desvio_medio_horas,
    max(predicted_at) AS ultima_predicao
   FROM delay_predictions_history
  WHERE predicted_at > (now() - '30 days'::interval)
  GROUP BY (COALESCE(transportadora, 'Sem transportadora'::text)), risco;
```

## public.v_prediction_accuracy_daily (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.delay_predictions_history |
| populada | n/a |
| comentário |  |


```sql
SELECT date_trunc('day'::text, predicted_at)::date AS dia,
    count(*) FILTER (WHERE confirmed_at IS NOT NULL) AS total_confirmadas,
    count(*) FILTER (WHERE was_accurate = true) AS acertos,
    round(100.0 * count(*) FILTER (WHERE was_accurate = true)::numeric / NULLIF(count(*) FILTER (WHERE confirmed_at IS NOT NULL), 0)::numeric, 2) AS acuracia_pct
   FROM delay_predictions_history
  WHERE predicted_at > (now() - '30 days'::interval)
  GROUP BY (date_trunc('day'::text, predicted_at)::date)
  ORDER BY (date_trunc('day'::text, predicted_at)::date);
```

## public.v_prediction_accuracy_daily_carrier (view)

| campo | valor |
|---|---|
| owner | postgres |
| security_invoker | sim |
| opções | security_invoker=true |
| depende de | public.delay_predictions_history |
| populada | n/a |
| comentário |  |


```sql
SELECT date_trunc('day'::text, predicted_at)::date AS dia,
    COALESCE(NULLIF(transportadora, ''::text), 'Sem transportadora'::text) AS transportadora,
    count(*) FILTER (WHERE confirmed_at IS NOT NULL) AS total_confirmadas,
    count(*) FILTER (WHERE was_accurate = true) AS acertos,
    round(100.0 * count(*) FILTER (WHERE was_accurate = true)::numeric / NULLIF(count(*) FILTER (WHERE confirmed_at IS NOT NULL), 0)::numeric, 2) AS acuracia_pct
   FROM delay_predictions_history
  WHERE predicted_at > (now() - '30 days'::interval)
  GROUP BY (date_trunc('day'::text, predicted_at)::date), (COALESCE(NULLIF(transportadora, ''::text), 'Sem transportadora'::text))
  ORDER BY (date_trunc('day'::text, predicted_at)::date), (COALESCE(NULLIF(transportadora, ''::text), 'Sem transportadora'::text));
```

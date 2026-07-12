# ADR 0012: In-App Database Observability (Sprints 34-36)

## Status
Accepted — 2026-07-12

## Context
As Sprints 31-33 entregaram baseline diário de queries (`internal.query_baseline`), RPC de detecção de regressões (`get_query_regressions_fast`) e timeouts defensivos por role. Toda essa telemetria vivia apenas no banco — inacessível ao operador sem `psql`. Faltava trazer para o produto: visualização, alertas ativos e um runbook interativo.

## Decision

### Sprint 34 — Painel `/admin/db-health`
- Nova rota admin-only (`ProtectedRoute requiredRole="admin"`).
- 4 cartões: Regressões de Query, Top 10 (pg_stat_statements), Cron Jobs, Tendência 7 dias.
- Novas RPCs `public.get_top_queries_fast(limit)` e `public.get_cron_jobs_status()` (SECURITY DEFINER, GRANT restrito a `authenticated`, verificação interna `has_role(auth.uid(),'admin')`).

### Sprint 35 — Alertas realtime
- Edge function `db-regression-monitor` executada a cada 15min via pg_cron. Consome `get_query_regressions_fast` e, para regressões ≥100%, insere em `nexus_tactical_logs` (level=`crit`, module=`DB_REGRESSION`) e distribui `notifications` para todos os admins.
- Hook `useDbRegressionAlerts` filtra `notifications` via Realtime (`metadata.event='db_regression'`) e emite toast crítico com ação "Abrir painel".
- Feature flags: `db_regression_alerts_enabled` (kill-switch) e `db_regression_threshold_pct`.

### Sprint 36 — Runbook interativo + histórico
- Tabela `public.db_health_snapshots` (admin-only SELECT, service_role para writes, índice BRIN em `created_at`).
- Edge function `db-health-snapshot` coleta métricas e — quando `?persist=true` — grava um snapshot. Cron `db-health-snapshot-hourly` executa a cada hora.
- Cron `cleanup-health-snapshots-daily` retém 30 dias via `public.cleanup_old_health_snapshots(30)`.
- `<HealthTrendChart />` (Recharts) e `<PerformanceRunbook />` (5 passos com botões que re-fetcham React Query).

## Correção Colateral
Durante a Sprint 36 detectamos que `audit_logs` (particionada por mês) não tinha partição para 2026-07…2026-12, o que quebrava qualquer INSERT em tabelas cobertas por `audit_log_trigger`. A mesma migration provisionou as 6 partições faltantes via `ensure_monthly_partition`, garantindo saúde imediata do audit trail.

## Consequences
- Operador admin ganha visibilidade em tempo real de regressões, jobs de manutenção, top ofensores e tendências.
- Regressões críticas produzem alerta ativo (toast + notification + log tático), não mais silenciosas.
- Snapshots horários geram série histórica com retenção controlada e custo mínimo (~720 linhas/mês).
- RPCs novas são SECURITY DEFINER com dupla defesa (GRANT restrito + check de role dentro da função) — mesmo padrão do ADR 0009.
- 3 novos cron jobs (agora 10 no total).

## Status Final: 10/10 blindado + observável end-to-end 🏆

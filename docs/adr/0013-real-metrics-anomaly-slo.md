# ADR 0013: Real Metrics, Anomaly Detection & SLO (Sprints 37-39)

## Status
Accepted — 2026-07-12

## Context
As Sprints 34-36 trouxeram a telemetria de DB para dentro do app, mas com dois gaps:
1. A edge `db-health-snapshot` gravava colunas `NULL` (PostgREST não expõe `pg_catalog`), então `HealthTrendChart` ficava vazio.
2. Não havia detecção estatística de anomalia nem agregação de SLO — só regressão de query média.

## Decision

### Sprint 37 — Coleta real de métricas
- `internal.collect_db_health()` (SECURITY DEFINER, schema privado) lê `pg_stat_activity`, `pg_stat_database`, `pg_database_size`, `pg_ls_waldir`, `pg_settings` e devolve JSONB.
- `public.persist_db_health_snapshot()` (SECURITY DEFINER, EXECUTE apenas para `service_role`) chama a interna e persiste em `db_health_snapshots`.
- Edge `db-health-snapshot` refatorada: modo persist chama a RPC; modo read retorna o último snapshot.

### Sprint 38 — Anomalias por z-score
- `public.get_health_anomalies_fast()` (admin-only) calcula média/desvio-padrão de 7 dias sobre `active_connections`, `cache_hit_ratio`, `deadlocks` e devolve z-score + severidade (`ok`/`warning`/`critical`) para a última leitura.
- Card `<AnomaliesCard />` no painel admin, refetch a cada 60s.

### Sprint 39 — SLO diário
- Tabela `public.db_slo_daily` (admin-only SELECT, service_role writes) agrega %conformidade em conexões (≤40), cache hit (≥95%) e ausência de deadlocks.
- `public.compute_db_slo_for(day)` calcula e faz UPSERT.
- Cron `compute-db-slo-daily` roda 03:15 UTC calculando o dia anterior.
- Card `<SloTrendCard />` (Recharts BarChart, 30d, linha de referência em 99%).

## Consequences
- `HealthTrendChart` agora tem dados reais (após primeiro cron horário).
- Time admin vê desvios estatísticos e SLO histórico sem sair do produto.
- +2 RPCs SECURITY DEFINER, +1 tabela, +1 cron (agora 11 jobs total).
- WARNs SECURITY DEFINER continuam por design (padrão ADR 0009).

## Status Final: 10/10 · observável · estatisticamente monitorado 🏆

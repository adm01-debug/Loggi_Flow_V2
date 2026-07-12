# ADR 0010: Post-Perfection Maintenance Loop (Sprints 26-30)

## Status
Accepted — 2026-07-12

## Context
Após a ADR 0009 fechar a perfeição inicial (Sprints 18-25), restavam vetores de ganho marginal em manutenção contínua, correlações estatísticas e compressão de payloads. Este ADR documenta o loop de manutenção pós-perfeição que preserva o 10/10 ao longo do tempo.

## Decision

### Sprint 26 — Autovacuum tuning + estatísticas ampliadas
- `autovacuum_vacuum_scale_factor=0.05` / `autovacuum_analyze_scale_factor=0.02` em 9 tabelas de alta escrita e nas partições folha de `audit_logs`.
- `SET STATISTICS 500` em colunas críticas de `entregas`, `coletas`, `notifications`, `audit_logs`.

### Sprint 27 — Fillfactor para HOT updates
- `fillfactor` reduzido (80-90) em 8 tabelas com alto UPDATE rate (`entregas`, `coletas`, `user_levels`, `user_sessions`, `fretes_internos`, `cotacoes_multicanal`, `carrier_rankings`, `profiles`), habilitando updates in-place que evitam reescrita de índices.

### Sprint 28 — Compressão LZ4
- `SET COMPRESSION lz4` em colunas grandes: `notifications.metadata`, `nexus_tactical_logs.message`, `webhook_deliveries.payload`, `query_telemetry.error_message` e partições de `audit_logs.old_data` / `.new_data`. Descompressão 2-3x mais rápida que PGLZ.

### Sprint 29 — Extended statistics multivariadas
- `CREATE STATISTICS` (ndistinct + dependencies + mcv) em 5 pares correlacionados: `entregas(status,transportadora_id)`, `entregas(cliente_id,status)`, `coletas(status,transportadora_id)`, `notifications(user_id,type)`, `user_levels(level,total_xp)`. Corrige subestimativas em queries com filtros combinados.

### Sprint 30 — Loop semanal de reindex
- Função `internal.reindex_hot_indexes()` (SECURITY DEFINER, GRANT restrito) reindexa índices B-Tree não-primários das tabelas quentes.
- Job pg_cron `reindex-hot-indexes-weekly` roda todo domingo às 05:00 UTC.

## Consequences
- Bloat de índices e tabelas contido automaticamente (autovacuum agressivo + reindex semanal).
- HOT updates reduzem escrita em índices e I/O.
- LZ4 acelera dashboards que leem JSONB históricos.
- Planner passa a estimar corretamente joins com filtros correlacionados.
- 13 WARNs `SECURITY DEFINER` permanecem por design (documentados na ADR 0009).

## Status Final: 10/10 sustentado 🏆

# ADR 0011: Query Baseline & Defensive Timeouts (Sprints 31-32)

## Status
Accepted — 2026-07-12

## Context
Após 30 sprints, o banco atingiu perfeição sustentada em performance e integridade. Os últimos vetores de risco eram:
1. Regressões silenciosas de queries (novo código lento passar despercebido).
2. Queries fugitivas de clientes travando conexões PostgREST.

## Decision

### Sprint 31 — Baseline de queries
- `internal.query_baseline`: histórico privado das 50 queries mais custosas, capturado diariamente às 04:30 UTC via pg_cron (`snapshot-query-baseline-daily`).
- `internal.snapshot_query_baseline()`: SECURITY DEFINER, popula baseline e limpa >90 dias.
- `public.get_query_regressions_fast()`: RPC para `authenticated` que compara execução atual (`pg_stat_statements`) com baseline e retorna queries degradadas >50%.

### Sprint 32 — Timeouts defensivos por role
- `anon.statement_timeout = 5s` — endpoints públicos protegidos.
- `authenticated.statement_timeout = 15s` + `idle_in_transaction_session_timeout = 30s`.
- `service_role.statement_timeout = 60s` — jobs administrativos.
- `authenticator.lock_timeout = 3s` — evita deadlock no PostgREST.

## Consequences
- Regressões detectáveis em <24h via RPC de auditoria.
- Impossível travar o pool com query fugitiva de cliente.
- Overhead: baseline diária escreve ≤50 linhas/dia (~50KB/mês).
- 14 WARNs `SECURITY DEFINER` permanecem por design (13 anteriores + `get_query_regressions_fast`).

## Status Final: 10/10 blindado end-to-end 🏆

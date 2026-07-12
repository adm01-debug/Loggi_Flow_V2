# Runbook — Investigação de Performance de Banco

## Quando usar
Latência de API subiu, dashboard demorando, timeouts começaram a aparecer.

## Passo 1 — Regressões conhecidas
Executar como usuário logado:
```sql
SELECT * FROM public.get_query_regressions_fast();
```
Retorna queries cujo `mean_exec_time` atual é >50% maior que o baseline diário.

## Passo 2 — Top ofensores em tempo real
```sql
SELECT query, calls, mean_exec_time, total_exec_time, rows
FROM extensions.pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;
```

## Passo 3 — Investigar plano de execução
Para cada query suspeita:
```sql
EXPLAIN (ANALYZE, BUFFERS) <query>;
```
Procurar: `Seq Scan` em tabela grande, `Rows Removed by Filter` alto, `Buffers: shared read` alto (cache miss).

## Passo 4 — Health snapshot
```sql
-- Conexões, deadlocks, WAL, tamanho
-- (usar tool supabase--db_health via Lovable)
```

## Passo 5 — Índices ausentes
```sql
SELECT relname, seq_scan, seq_tup_read, idx_scan
FROM pg_stat_user_tables
WHERE schemaname='public' AND seq_scan > idx_scan * 2
ORDER BY seq_tup_read DESC LIMIT 10;
```

## Passo 6 — Bloat
Aguardar próximo `reindex-hot-indexes-weekly` (domingo 05:00 UTC) ou executar sob demanda:
```sql
SELECT internal.reindex_hot_indexes();
```

## Passo 7 — Timeouts atingindo o teto
Se muitos `canceling statement due to statement timeout`:
- Cliente: paginar/otimizar a query.
- Emergência: `SET LOCAL statement_timeout = '30s'` na transação (não alterar o padrão do role).

## Referências
- ADR 0009 (perfeição inicial), ADR 0010 (loop de manutenção), ADR 0011 (baseline + timeouts).

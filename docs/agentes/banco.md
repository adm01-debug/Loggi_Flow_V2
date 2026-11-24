# Banco de dados — referência para agentes

Ler quando for rodar SQL, criar/aplicar migration ou auditar estado de banco. Resumo no `AGENTS.md`; aqui
está o detalhe. Errar o banco neste projeto já custou retrabalho real (cutover de projeto, triggers
duplicados, policies fora de paridade).

## Onde se trabalha

| Situação | Banco | Como |
|---|---|---|
| Diagnóstico | **produção, só leitura** | `SELECT` pelo MCP `SUPABASE - LOGGI FLOW V2 - MCP`; nunca escrita para "testar" |
| Migration nova | arquivo em `supabase/migrations/` | PR com o `.sql` → **chame o dono** para aplicar; não existe workflow de apply |
| Teste de comportamento | suíte do repo | `npm run test:rls` / `npm run test:security` batem no PostgREST de produção com a **anon key** (sem privilégio) |
| Migration destrutiva, segredos, rotação de chaves | **só com o dono do projeto** | — |

**Não há staging.** O dev server aponta para o que estiver em `.env`
(`VITE_SUPABASE_URL=https://jvfhclubfpxrtrrazrgr.supabase.co`), isto é, **produção** — confira antes de
testar tela e nunca rode script de escrita "só para ver".

## Banco OFICIAL

| O que | Valor |
|---|---|
| Projeto Supabase | **`jvfhclubfpxrtrrazrgr`** (Supabase Cloud) — `supabase/config.toml:1`, `.env`, `deploy-functions.yml` |
| URL | `https://jvfhclubfpxrtrrazrgr.supabase.co` |
| Dashboard | https://supabase.com/dashboard/project/jvfhclubfpxrtrrazrgr |
| PostgreSQL | 17.6 (`docs/audit/2026-08-31_auditoria_pos_remediacao.md`) |
| MCP para SQL | **`SUPABASE - LOGGI FLOW V2 - MCP`** — conecta como `postgres`/`service_role`, ignora RLS e **aceita DDL** |
| Ledger de migrations | `supabase_migrations.schema_migrations` |
| Arquivos de migration | 244 `.sql` em `supabase/migrations/` |

### Projetos que NÃO são o destino (não escrever neles)

- **`hgicfqjayrjurivtygqf`** — Lovable Cloud, **origem** do cutover. Serve só como referência de paridade
  (policies, corpo de função, cron) e é a fonte de `scripts/historico/cleanup_triggers_source.sql`,
  `scripts/ops/backup_origem.sh` e `docs/ops/cron_jobs_origem.json`. Escrita ali não afeta o app.
- **`uwbpzfcysppwikfpnzok`** — ref **morto**, ainda citado em `index.html` (dns-prefetch/preconnect) e em
  `supabase/functions/send-password-reset/index.ts` (URL de fallback do e-mail de reset). É dívida a limpar,
  nunca destino de query.
- Há vários Supabase quase homônimos na conta do dono (Zapp Web V2, Gestão de Clientes, Gestão de Produtos).
  **Confirme qual MCP carregou antes de rodar SQL.**

### SQL avulso já aplicado (fora do ledger de migrations)

**Não há DDL avulso pendente.** Os dois scripts abaixo já rodaram e estão guardados em
`scripts/historico/` apenas como registro. Nenhum deles se reexecuta.

| Caminho | Aplicado em | Projeto | Situação |
| --- | --- | --- | --- |
| `scripts/historico/origem_remediacao_2026-08-31.sql` | 2026-08-31 | `hgicfqjayrjurivtygqf` (origem, somente leitura desde o cutover) | Já aplicado — **não reexecutar** |
| `scripts/historico/cleanup_triggers_source.sql` | 2026-08-31 (blocos 1-2) | `hgicfqjayrjurivtygqf` (origem, somente leitura desde o cutover) | Já aplicado — **não reexecutar**; o bloco 3 foi substituído por `cron.unschedule` na origem |

Um agente que encontre um `.sql` chamado "remediação" ou "cleanup" e conclua que é
tarefa pendente está errado: o registro está aqui, com data e projeto.

**DDL novo não vira script avulso.** Vai para `supabase/migrations/` e segue a ordem
da primeira regra abaixo (arquivo → PR → merge → deploy do código → apply). Não existe
workflow que aplique DDL: quem aplica é o dono, pelo MCP.

## Regras de migration

1. **Ordem obrigatória: arquivo → PR → merge em `main` → deploy do código → apply no banco.** Nunca DDL a
   partir de branch aberta. `REVOKE`, `DROP`, rename ou mudança de contrato de função usada pelo front/edges
   só depois do deploy do código correspondente.
2. **Quem aplica é o dono.** Não existe workflow de apply (`deploy-functions.yml` publica edge function, não
   DDL) nem registro automático no ledger. Abra a PR com o `.sql` e chame.
3. **Nomes de arquivo:** o histórico tem dois padrões — `<timestamp>_<uuid>.sql` (gerado pelo Lovable) e
   `<timestamp>_<slug>.sql` (escrito à mão, ex. `20260901000000_cron_jobs_canonical.sql`). Para arquivo novo
   use **slug**; nunca reaproveite um timestamp já existente e nunca renomeie migration antiga "para
   organizar" (o ledger guarda a versão original).
4. **Migration é histórico, não estado.** A verdade é o banco ao vivo (ou a fonte `supabase/` da branch
   `contexto`). Antes de escrever DDL, leia a estrutura real — tabela/coluna/policy pode já ter sido criada
   fora do repo.
5. **Replay do zero não reproduz produção:** há migrations de remediação pós-cutover
   (`20260831120100_drop_legacy_objects_d2.sql`, `20260831120200_policy_parity_with_origin.sql`,
   `20260831130100_drop_legacy_columns.sql`) que pressupõem o estado da origem.
6. `CREATE INDEX CONCURRENTLY` e `VACUUM` não rodam dentro de transação — pelo MCP, use `CREATE INDEX`
   simples ou peça ao dono rodar no SQL Editor.
7. Toda mudança de DDL vem com: o `.sql` versionado, o efeito em RLS declarado na PR e, se mexer em tabela
   consumida pelo front, a regeneração de `src/integrations/supabase/types.ts` (**arquivo gerado — não
   editar à mão**).

## RLS, exclusão e versionamento

- **RLS é construída sobre `SECURITY DEFINER`** (`docs/adr/0014-security-definer-rls-pattern.md`):
  `public.has_role(auth.uid(), 'admin')` é a base de toda policy que discrimina papel. Tornar essas funções
  `SECURITY INVOKER` causa recursão infinita em `user_roles`; revogar `EXECUTE` de `anon`/`authenticated`
  quebra o app. Os avisos `0028/0029` do linter do Supabase sobre elas são falso-positivo **conhecido e
  aceito** — não "corrija".
- **Exclusão é lógica:** coluna `deleted_at` e hook `useSoftDelete` (`docs/SOFT_DELETE_POLICY.md`). Query
  nova em tabela com histórico filtra `deleted_at IS NULL`.
- **Concorrência otimista** por `entity_versions` (`20241231000001_entity_versions.sql`).
- **Teste de RLS real:** `tests/security/rls-access.spec.ts` bate no PostgREST com a anon key do projeto
  **atual** e espera bloqueio nas tabelas sensíveis. Se você mudar policy, rode `npm run test:rls`. (Esse
  teste já esteve "viciado" usando a anon key do projeto antigo contra a URL nova — tudo dava 401 e passava
  sem testar nada; o arquivo hoje usa o ref correto, e qualquer troca de key ali tem que ser conferida.)

## Jobs agendados (pg_cron)

27 jobs catalogados em `docs/ops/cron_jobs_origem.json`; a versão canônica no destino está em
`supabase/migrations/20260901000000_cron_jobs_canonical.sql`. Famílias: observabilidade do banco
(`db-health-snapshot-hourly`, `db-regression-monitor-15m`, `compute-db-slo-daily`,
`check-health-score-regression-hourly`, `auto-revert-ineffective-indexes-daily`), limpeza/retenção
(`cleanup-telemetry-daily`, `cleanup-notifications-weekly`, `cleanup-old-delay-predictions`,
`nexus_partition_retention`), partições (`ensure-future-partitions-monthly`), previsão
(`predict-delays-every-30min`, `accuracy-meta-monitor-daily`, `accuracy-weekly-digest-monday`) e gateway RTE
(`rte-gateway-health-check`, `rte-slo-daily-rollup`).

Vários desses jobs chamam **edge functions** por `pg_net`: mexer no nome, na rota ou na auth de uma função
dessas (`predict-delays-scheduled`, `db-health-snapshot`, `db-regression-monitor`, `accuracy-*`) quebra o job
em silêncio. `predict-delays-scheduled` roda com `verify_jwt = false` e valida `x-internal-secret`
(`INTERNAL_FN_SECRET`) ou `Bearer service_role` no código.

## Auditoria e manifestos

`scripts/audit/` guarda o SQL de inventário usado nas auditorias (`manifest_full.sql`, `manifest_summary.sql`,
`manifest_detail.sql`, `manifest_data.sql`, `content_hash.sql`) com `exceptions.json` e README próprio — todos
idempotentes e só leitura. Use-os antes de escrever auditoria nova; relatórios datados ficam em `docs/audit/`
e em `ESTADO_ATUAL*.md` (retrato de 2026-08/09, não o presente).

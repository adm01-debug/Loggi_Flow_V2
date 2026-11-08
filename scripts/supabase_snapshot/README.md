# supabase-snapshot

Mantém um retrato completo do banco OFICIAL (`jvfhclubfpxrtrrazrgr`) para agentes de IA lerem **antes** de
qualquer tarefa ou planejamento que toque banco, RLS, functions, cron, storage ou edge functions.

## Status neste repo

**Precisa do secret `SUPABASE_DB_URL`, que ainda não existe.** Enquanto ele não for criado, o job `banco`
do `contexto.yml` sai **verde com aviso** e a pasta `docs/contexto/supabase/` fica vazia — as outras duas
fontes (`codigo/` e `regras/`) continuam sendo publicadas normalmente. O `SUPABASE_ACCESS_TOKEN` que já
existe no repo serve à Management API (edge functions, auth, config), não à introspecção do Postgres.

## Onde está o resultado (neste repo)

O job `banco` de `.github/workflows/contexto.yml` roda a cada 10 min e publica em `docs/contexto/supabase/`
da branch **`contexto`** (junto com `codigo/` e `regras/`; índice em `docs/contexto/00-INDEX.md`).
Só há commit quando algo mudou. A main nunca recebe push deste workflow.

Como ler, sem trocar de branch:

```sh
git fetch origin contexto
git show origin/contexto:docs/contexto/supabase/README.md          # protocolo + resumo
git show origin/contexto:docs/contexto/supabase/tables/public/<tabela>.md
git show origin/contexto:docs/contexto/supabase/lints.md           # antes de mexer em RLS/functions/índices
```

Ou por URL (sem clone): `https://raw.githubusercontent.com/adm01-debug/Loggi_Flow_V2/contexto/docs/contexto/supabase/README.md`.

Última coleta concluída publicada: `docs/contexto/supabase/manifest.json` → `gerado_em` (UTC).
Última publicação: `git log -1 --format=%cI origin/contexto -- docs/contexto/supabase`.
O manifest também informa `erros` e `carried`; uma coleta recente pode ser parcial. Detalhes em `errors.md`.

Neste repo `schema.sql` e `types.ts` estão desligados (`PGDUMP=false`, `GEN_TYPES=false` no workflow):
o runner do GitHub só tem `pg_dump` 16 e o projeto roda PG 17.

## Secret necessário

`SUPABASE_DB_URL` (Settings → Secrets and variables → Actions), com estas três exigências:

1. **Session pooler, não conexão direta.** O host direto `db.<ref>.supabase.co` é só IPv6 e o runner do
   GitHub não tem IPv6 → falha na conexão. Use o "Session pooler" do dashboard:
   `postgresql://postgres.jvfhclubfpxrtrrazrgr:<senha>@aws-0-<regiao>.pooler.supabase.com:5432/postgres`.
2. **Usuário `postgres` (recomendado).** O `cron.job` e `cron.job_run_details` têm RLS com policy
   `username = current_user`; um role read-only comum enxerga zero jobs. O `postgres` do Supabase tem
   `BYPASSRLS`. O script abre a sessão em `default_transaction_read_only = on` — mesmo com `postgres`
   nada é escrito.
3. Se preferir um role separado (perde o cron, vê o resto): SQL abaixo.

## O que é coletado

| Fonte | O que entra |
|---|---|
| Postgres (catálogo) | schemas (+USAGE das roles da API), tabelas (RLS on/forced, partições, replica identity), colunas (tipo, default, identity/generated, enum, comentário), constraints (PK/FK/UNIQUE/CHECK com ON DELETE/UPDATE e referências reversas), índices (método, colunas, predicado), views + materialized (security_invoker, dependências), functions/procedures (corpo, security definer, search_path, quem pode executar via RPC), triggers (timing/eventos; inclui `auth.users` e `storage.objects`), policies RLS (inclui `storage` e `realtime.messages`), enums (+ onde são usados)/domains/composites, extensões, sequences (owned by), grants (tabela, coluna, sequence, **default privileges**), roles (+`rolconfig`: timeouts por role) |
| Supabase | `cron.job`, `pgmq` (filas), `supabase_migrations.schema_migrations` (com SQL), `storage.buckets`, `vault.secrets` (só nomes), Database Webhooks, realtime publications, foreign servers (credenciais redigidas) |
| Lints (`lints.md`) | RLS desabilitado / sem policies, tabela sem PK, FK sem índice, SECURITY DEFINER sem `search_path`, view em `public` sem `security_invoker`, função chamável por `anon`, extensão em `public`, policy com `auth.uid()` sem `(select …)`, tabela no Realtime sem REPLICA IDENTITY FULL |
| Relacionamentos | todas as FKs + diagrama ER Mermaid (até 120 tabelas) |
| Referências a cada função | referências estáticas (`.rpc('fn')` ou `fn(` em `src/`, `supabase/functions/`, migrations ativas, scripts…), jobs do pg_cron, triggers, outras funções e views |
| Management API (opcional) | edge functions (versão, verify_jwt, entrypoint, URL), nomes dos secrets, auth (providers, hooks, config), PostgREST (schemas expostos, max_rows), Postgres/pooler/storage config, network/SSL, branches, PITR/backups — segredos redigidos |
| Métricas voláteis (`stats.*`, `cron-runs.md`) | tamanho por tabela/schema, linhas e scans (aproximados), índices nunca usados, storage por bucket, auth (agregados), filas, top queries do `pg_stat_statements` (normalizadas), conexões, saúde dos serviços, últimas execuções do cron |

Nunca sai: linha de tabela, dado de usuário, valor de secret/chave/senha, connection string.

### Role somente leitura (opcional — não enxerga pg_cron)

```sql
create role snapshot_reader login password '<senha-forte>';
grant pg_read_all_data to snapshot_reader;           -- leitura de todos os schemas
grant usage on schema cron, vault, storage, auth, supabase_migrations to snapshot_reader;
```
Para `pg_stat_statements` e `pg_stat_activity` completos, adicione `grant pg_read_all_stats to snapshot_reader;`.

## Variáveis opcionais (no workflow, bloco `env`)

| Var | Default | Efeito |
|---|---|---|
| `SNAPSHOT_DIR` | `docs/supabase` (no workflow: `docs/contexto/supabase`) | pasta de saída |
| `PGDUMP_SCHEMAS` | `public` | schemas do `schema.sql`, separados por vírgula |
| `GEN_TYPES` | `true` | gera `types.ts` via `npx supabase gen types` |
| `PGDUMP` | `true` | gera `schema.sql` via `pg_dump` (exige pg_dump >= versão do servidor) |
| `SNAPSHOT_EXCLUDE_SCHEMAS` | vazio | schemas extras a ignorar na introspecção |
| `SNAPSHOT_INCLUDE_SCHEMAS` | vazio | schemas internos do Supabase a forçar inclusão |
| `STAT_STATEMENTS_TOP` | `15` | consultas mais custosas em `stats.md` (0 desliga) |
| `CRON_RUNS_PER_JOB` | `3` | execuções recentes guardadas por job do pg_cron |
| `REPO_ROOT` | `.` | raiz do repo para cruzar funções × código (vazio desliga) |
| `CODE_SCAN_DIRS` | `src,supabase/functions,supabase/migrations,scripts,…` | pastas varridas na busca de chamadas |

## Comportamento

- Só há commit quando o conteúdo estrutural mudou. Métricas voláteis vivem em `stats.md`/`stats.json`/`cron-runs.md`; quando só elas mudam, o commit é limitado a 1 por hora (`VOLATILE_MIN_INTERVAL_MIN` no workflow).
- Schemas internos do Supabase (`auth`, `storage`, `realtime`, `extensions`, `graphql*`, `net`, `pgsodium`, `vault`…) ficam fora da introspecção geral; o que importa deles entra em seções dedicadas. Use `SNAPSHOT_INCLUDE_SCHEMAS` para forçar um deles.
- Uma seção que falha (ex.: sem permissão em `vault`) é reaproveitada da coleta anterior com aviso no topo do arquivo — nunca gera "tudo removido" no `CHANGELOG.md`.
- Falha em uma seção não derruba as outras: vai para `errors.md` e para o README. O job só falha se o banco inteiro não responder ou se o guard de segredos detectar algo.
- Sessão read-only no Postgres, `statement_timeout` 90s, `lock_timeout` 5s.
- Conexão com `prepare_threshold=None`: funciona na conexão direta e no pooler (session ou transaction mode).

## Rodar localmente

```bash
pip install -r scripts/supabase_snapshot/requirements.txt
export SUPABASE_DB_URL='postgresql://...'
python scripts/supabase_snapshot/snapshot.py
```

## Testes offline

```sh
python3 scripts/supabase_snapshot/test_snapshot.py -v
```

Não exigem banco, rede, credenciais nem o pacote psycopg: a conexão é simulada.

Origem: portado de `adm01-debug/Zapp_Web_V2` (`scripts/supabase_snapshot/`), sem alteração de código.

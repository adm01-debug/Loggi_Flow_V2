# Auditoria de paridade origem → destino (in-DB diff)

O destino (`jvfhclubfpxrtrrazrgr`) puxa o manifesto da origem via `pg_net` → `exec_sql` e compara com o próprio catálogo.
Nada passa por ferramenta externa; só as diferenças saem.

- `manifest_full.sql` — saída única (section, key, def): schema, ext, role, enum, type, table, column, constraint, index, policy,
  function, fn_acl, trigger, view, sequence, grant, defacl, event_trigger, publication, cron, bucket, comment, migration,
  auth_user, storage_objects, vault. ACLs de `sandbox_exec`, versão de `pg_net`, `exec_sql`/`mcp_exec*` e rolconfig de
  `service_role`/`supabase_realtime_admin` já são neutralizados (exceções de plataforma).
- `manifest_data.sql` — rows + md5 de conteúdo (`jsonb_strip_nulls(to_jsonb(row))`, ordenado) por tabela public/internal.
- `manifest_detail.sql` — versão enxuta do catálogo de public/internal (schema, table, column, constraint, index, policy,
  function, trigger, enum), sem as neutralizações do `manifest_full`.

Os três têm a mesma forma: `DROP TABLE IF EXISTS pg_temp._manifest_*` + `CREATE TEMP TABLE` + `INSERT` + `SELECT ... ORDER BY`

- `DROP` — são vários comandos, não um SELECT só. Só leem catálogo e dados; nada é alterado. Podem rodar duas vezes na mesma
  sessão, e uma sobra de execução interrompida não contamina a seguinte. `manifest_full.sql` exige os schemas do Supabase
  (`auth`, `storage`, `supabase_migrations`); `cron` e `vault` ausentes viram uma linha `<ausente>`. `manifest_data.sql` precisa
  de role que leia todas as tabelas (postgres). Chave nunca é nula: usuário sem e-mail sai como `<sem-email:uuid>`, job de cron
  sem nome como `<sem-nome:jobid>`, e comentário de função leva os argumentos (`public.f(a integer)`).

Direto pelo psql (falha no primeiro erro, saída `section|key|def`):
`psql "$URL" -X -q -At -v ON_ERROR_STOP=1 -f scripts/audit/manifest_full.sql`

Execução (destino, role postgres): schema `audit_tmp` com `sql(name, body)`, `cfg(src_url, src_key)`, `manifest(side, section, key, def)`,
view `diff` (SAME/DIFF/ONLY_SRC/ONLY_DST) e função `first_diff(a,b)`. Passos: (1) `net.http_post` → `exec_sql` com o body do manifesto;
(2) `INSERT ... jsonb_to_recordset(net._http_response.content)` como `src`; (3) `EXECUTE` local como `dst`;
(4) `SELECT section, status, count(*) FROM audit_tmp.diff GROUP BY 1,2`. A chave da origem é removida de `cfg` ao final.
Relatório: `docs/audit/2026-08-31_auditoria_pos_remediacao.md`.

`exceptions.json` é só documentação das divergências aceitas — nenhum script o lê (parte dessas neutralizações está escrita à
mão no `manifest_full.sql`).

## Resumo e hash de conteúdo (comparação manual entre dois bancos)

- `manifest_summary.sql` — uma linha por seção com a contagem em `public` (`tables`, `columns`, `indexes`,
  `policies`, `functions`, `triggers`) mais `cron_jobs`, `migrations` e `storage_buckets`. `cron_jobs` sai
  **NULL** quando o `pg_cron` não está instalado (0 = instalado, sem jobs).
- `content_hash.sql` — `(tablename, row_count, content_hash)` por tabela de `public`, mesmo algoritmo de
  `manifest_data.sql`: o hash não depende da ordem de inserção. Ficam de fora `audit_logs`,
  `system_heartbeat` e `cron_job_run_details`; partições entram pela tabela-mãe; tabela vazia = hash `''`.
  Fixa `TimeZone`/`IntervalStyle`/`extra_float_digits`/`bytea_output` só na própria transação e roda com
  `row_security = off` (se RLS esconderia linhas do role, falha em vez de devolver hash parcial).

Rodar nos dois bancos como `postgres` e comparar:
`psql "$URL" -X -At -f scripts/audit/content_hash.sql > destino.txt` e `diff origem.txt destino.txt`.

Limites: usam tabela temporária (não rodam em transação `READ ONLY`); `content_hash.sql` ignora chave com
`null` dentro de coluna json/jsonb e guarda ~32 bytes por linha em memória (tabela com dezenas de milhões
de linhas: pôr na lista de exclusão e comparar por faixa de id).

Teste: `AUDIT_TEST_PG_URL=postgres://postgres@127.0.0.1:5432/postgres node --test scripts/audit/manifest-summary-content-hash.unit.mjs`
— mesmo servidor descartável do `sql.unit.mjs` (cria e apaga bancos `audit_t_i_*`).

## Testes

`node --test scripts/audit/sql.unit.mjs` roda os três manifestos e os dois scripts históricos da origem
(`scripts/historico/cleanup_triggers_source.sql`, `scripts/historico/origem_remediacao_2026-08-31.sql`) num Postgres descartável com fixture estilo
Supabase. Com `AUDIT_TEST_PG_URL` (superuser de um servidor de teste) cria e apaga bancos `audit_t_*` nele; sem a env, sobe um
cluster temporário com `initdb`/`pg_ctl` (não funciona como root). Sem nenhum dos dois, os testes são pulados. Nunca aponte
para o banco do projeto.

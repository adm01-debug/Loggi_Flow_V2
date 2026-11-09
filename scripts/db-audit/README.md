# scripts/db-audit — fotos do banco oficial e seus guardas

Tudo aqui serve ao workflow `.github/workflows/types-sync.yml`: ele lê o banco oficial
(`jvfhclubfpxrtrrazrgr`, só leitura), gera quatro artefatos, compara com os commitados e, se houver
diferença, abre a PR `automation/types-sync`. Nenhum script deste diretório escreve no banco.

| Artefato commitado                                                                        | Gerado por            | Conferido por              |
| ----------------------------------------------------------------------------------------- | --------------------- | -------------------------- |
| `src/integrations/supabase/types.ts`                                                      | `gen-types.sh`        | `diff` no workflow         |
| `supabase/schema-catalog.json` (nomes de tabelas, views, enums, colunas, funções)         | `catalog.sql`         | `check-catalog-fresh.mjs`  |
| `supabase/schema-manifest.json` (hash da definição de cada objeto, RLS, policies, grants) | `manifest.sql`        | `check-manifest-fresh.mjs` |
| `scripts/db-audit/grants-baseline.json` (o que `anon` executa/lê; contagens por papel)    | `grants-baseline.sql` | `check-grants-fresh.mjs`   |

`supabase/schema-catalog.json` e `supabase/schema-manifest.json` **ainda não existem** no repositório e
`grants-baseline.json` é um placeholder: a primeira execução do `types-sync` com o secret `DESTINO_URL`
os cria (catálogo/manifesto ausentes contam como diferença a revisar, não como erro).

## Rodar da raiz do repositório

Os caminhos padrão (`supabase/...`, `scripts/db-audit/...`, a CA em `certs/`) são relativos ao diretório
atual. Os três comparadores e o `local-pg-proxy.mjs` só aceitam arquivos dentro do repositório ou do
diretório temporário do sistema.

## Os scripts

**`catalog.sql`, `manifest.sql`, `grants-baseline.sql`** — um `SELECT` cada, só leitura, que devolve um JSON.
Rodar como o workflow roda:

```sh
psql "$DESTINO_URL" -X -v ON_ERROR_STOP=1 -At -f scripts/db-audit/catalog.sql > /tmp/catalog.new.json
```

A saída não depende de OID, da ordem física do catálogo nem do `search_path` da sessão (cada `SELECT` fixa
`public, extensions` só durante a própria execução, que é o padrão do papel `postgres` no Supabase). Só o
campo `generated_at` muda entre duas execuções.

**`check-catalog-fresh.mjs`, `check-manifest-fresh.mjs`, `check-grants-fresh.mjs`** `<arquivo_fresco.json>` —
comparam o JSON recém-gerado com o commitado. Saída: `0` igual, `1` diferença a revisar, `2` entrada não
confiável (JSON inválido, identidade do banco não comprovada, caminho fora das raízes) — com `2` o snapshot
nunca é atualizado. Catálogo e manifesto exigem `DESTINO_URL` no ambiente e conferem que ela aponta para o
projeto de `database-identity.json`. Variáveis para teste: `CATALOG_PATH`, `MANIFEST_PATH`,
`GRANTS_BASELINE_PATH`, `CATALOG_IDENTITY_PATH`.

**`database-identity.mjs` + `database-identity.json` + `certs/`** — prova de que a conexão é a do banco
oficial: o JSON guarda o SHA-256 do project ref (`jvfhclubfpxrtrrazrgr`), database, schema e versão maior do
Postgres (17); a CA raiz do Supabase fica versionada e com fingerprint fixo no código;
`endurecerDestinoTls` força `sslmode=verify-full` com essa CA e recusa qualquer tentativa de baixar o TLS.
Se o Postgres do projeto mudar de versão maior, atualize `server_major` no JSON (os comparadores saem `2`
até lá).

**`psql-environment.mjs`** — `withPsqlEnvironment(url, callback)` entrega ao `psql` a conexão em variáveis
`PG*` e a senha num `PGPASSFILE` temporário (0600), nunca em argv nem no ambiente. Aceita só `sslmode`,
`sslrootcert`, `connect_timeout`, `application_name`, `options`, `channel_binding` e `target_session_attrs`
na query da URL. `PSQL_CONNECT_RETRIES` (máx. 5) e `PSQL_CONNECT_RETRY_DELAY_MS` ligam nova tentativa só
para falha de transporte.

**`gen-types.sh`** `[--local] [saida]` — roda `supabase gen types typescript --schema public`. A CLI entrega
a `--db-url` em texto puro a um container; por isso, com `pgbouncer` instalado, o script sobe um proxy
só-loopback (`local-pg-proxy.mjs` escreve a config com a credencial real num diretório 0700) e a CLI recebe
uma URL descartável. Em CI sem `pgbouncer` ele falha em vez de expor a credencial. Tenta 3 vezes
(`GEN_TYPES_RETRY_DELAY_S`, padrão 10) e sempre derruba o proxy e apaga os temporários ao sair.
Saída: `0` gerado, `1` falha, `2` uso inválido.

**`supabase-usage-guard.mjs`** `[--prune-obsolete]` — varre `src/` e `supabase/functions/` atrás de
`.from('x')` e `.rpc('y')` no cliente principal e falha (`1`) se o alvo não existir em
`supabase/schema-catalog.json`. Migrations com data igual ou posterior ao `generated_at` do catálogo são
projetadas por cima dele (`CREATE`/`DROP`/`RENAME` de tabela, view e função no início de um statement).
Dívida aceita vai em `known-violations.json` (chave `tipo:alvo:arquivo`); `--prune-obsolete` remove de lá o
que já sumiu do código. `2` = catálogo ou baseline ausente/inválido. Um segundo cliente Supabase (outro
banco) precisa entrar na lista `NON_MAIN` do script, senão as chamadas dele são cobradas como violação.

**`check-remocoes-destrutivas.mjs`** `[catalogo_antigo.json] [catalogo_novo.json]` — Gate 3: bloqueia (`1`)
quando uma tabela, view, função ou enum que saiu do catálogo ainda tem consumidor no código. `2` = catálogo
ausente ou inválido.

**`lote-pendente.mjs`** — classifica "há migration no disco ainda não aplicada no banco" chamando
`check-migration-drift.mjs`, que **não foi portado** para este repositório. Sem `DESTINO_URL` sai `0`; com
ela e sem o classificador sai `3` ("não classificado"), e o workflow segue como "sem apply pendente".

**`sql-lexer.mjs`** — lexer SQL (comentários aninhados, strings, `E'...'`, dollar-quote,
`standard_conforming_strings`) usado pelo guard para não enxergar DDL dentro de comentário, string ou corpo
de função.

## Testes

```sh
node --test scripts/db-audit/*.unit.mjs
```

Offline, sem credencial, alguns segundos. `sql-banco-local.unit.mjs` fica pulado por padrão; ele roda os três
SQL e os comparadores contra um Postgres **local e descartável** (o teste recria o schema `public` desse
banco e recusa qualquer host que não seja local ou banco cujo nome não comece com `dbaudit_test`):

```sh
createdb dbaudit_test
DB_AUDIT_TEST_URL='postgresql://postgres:senha@127.0.0.1:5432/dbaudit_test' \
  node --test scripts/db-audit/sql-banco-local.unit.mjs
```

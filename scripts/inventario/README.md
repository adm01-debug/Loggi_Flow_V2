# scripts/inventario — inventário do estado real (banco, rotas, edge functions)

**O que faz:** refaz `inventario/estado/{banco,rotas,edges}.json` a partir do banco oficial (somente
leitura) e do código. É a fonte de consulta para agentes: quais tabelas existem e quem as usa, quais URLs
o front tem e o que cada página chama, quais edge functions existem, que segredos leem e quem as invoca.

**Quem roda:** `.github/workflows/inventario-estado-semanal.yml` (segunda 10:23 UTC e `workflow_dispatch`),
nesta ordem: `gerar-banco.mjs` → `gerar-rotas.mjs` → `gerar-repo.mjs < /dev/null` → `mudou-conteudo.mjs`.
Se o último imprime `true`, o workflow abre/atualiza o PR `automation/inventario-estado`.

**Secrets:** só `SUPABASE_ACCESS_TOKEN` (o mesmo do `deploy-functions.yml`), e só o `gerar-banco.mjs` o usa.
Os outros três não usam rede nem credencial.

| Script                            | Lê                                                                                                                                                                   | Grava                                                                                     | Exit                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `gerar-banco.mjs` (+ `banco.sql`) | banco oficial `jvfhclubfpxrtrrazrgr` pela Management API (`POST /database/query/read-only`, `GET /functions`); `src/`, `supabase/functions/`, `supabase/migrations/` | `inventario/estado/banco.json`                                                            | 0 gravou · 2 não gravou                                   |
| `gerar-rotas.mjs`                 | `src/App.tsx`, `src/components/layout/AppSidebar.tsx`, imports de cada página                                                                                        | `inventario/estado/rotas.json`                                                            | 0 gravou/em dia · 1 `--check` desatualizado · 2 não gerou |
| `gerar-repo.mjs`                  | `supabase/functions/`, `src/`, `supabase/migrations/`, `tests/e2e/`, `.github/workflows/`, `supabase/config.toml` (precisa de `rg`)                                  | `inventario/estado/edges.json` (e `tabelas-uso.json` se receber nomes de tabela no stdin) | 0 gravou · ≠0 não gravou                                  |
| `mudou-conteudo.mjs`              | os três JSON × a versão do `HEAD`                                                                                                                                    | nada (imprime `true`/`false`)                                                             | 0 decidiu · 2 não dá para decidir                         |

Todos acham a raiz do repo pelo próprio caminho: funcionam de qualquer diretório. Todos falham fechado —
se não dá para gerar o inventário certo, saem com erro e **não gravam** (nada de inventário pela metade).

## Como rodar

```sh
# rotas e edges: só leem o código
node scripts/inventario/gerar-rotas.mjs            # grava rotas.json
node scripts/inventario/gerar-rotas.mjs --check    # exit 1 se o rotas.json commitado está desatualizado
node scripts/inventario/gerar-repo.mjs < /dev/null # grava edges.json (fora de terminal, sempre com < /dev/null)
printf 'coletas\nentregas\n' | node scripts/inventario/gerar-repo.mjs   # grava também tabelas-uso.json

# banco, com token (é o que a CI faz)
SUPABASE_ACCESS_TOKEN=... node scripts/inventario/gerar-banco.mjs

# banco, sem token (sessão de agente): rode scripts/inventario/banco.sql no MCP oficial
# (SUPABASE - LOGGI FLOW V2 - MCP), salve a resposta num arquivo e:
node scripts/inventario/gerar-banco.mjs --entrada /caminho/resposta.json [--functions /caminho/functions.json]

# vale abrir PR?
node scripts/inventario/mudou-conteudo.mjs         # true | false
```

`--help` em qualquer um mostra o uso sem gravar nada.

## O que cada um garante

**`gerar-banco.mjs`** — o `banco.sql` é um único `SELECT` em catálogo e tabelas de estado, roda em transação
somente leitura e devolve um JSON. Do `cron.job` sai só o nome das funções chamadas, nunca o comando (que
tem URL e cabeçalho). Antes de gravar, o script:

- confere que a resposta é do banco oficial: ≥ 90 % das tabelas batem com `supabase/schema-manifest.json`
  (quando existir) ou com o `Tables` de `src/integrations/supabase/types.ts`, e o ledger
  (`supabase_migrations.schema_migrations`) bate com `supabase/migrations/` (até 10 % de diferença na
  contagem e maior versão entre as 20 mais recentes). Partições mensais ficam fora da conta de tabelas;
- recusa saída com cara de credencial (`Bearer …`, JWT, `sb_secret_`);
- só fala com `api.supabase.com` (ou `127.0.0.1`, para teste) e só com o projeto oficial
  (`SUPABASE_PROJECT_REF` diferente exige `INVENTARIO_PERMITIR_OUTRO_PROJETO=1`).

Rede: timeout de 120 s por chamada (`INVENTARIO_API_TIMEOUT_MS`); HTTP 429/5xx e queda de conexão são
repetidos até 3 vezes (`INVENTARIO_API_ESPERA_MS`, padrão 2000). 401/403/404 dizem o que conferir; 400
(o `banco.sql` foi recusado) roda uma consulta de diagnóstico e diz se falta `pg_cron` ou o ledger. O corpo
do erro da API nunca é repassado.

Alertas calculados: `tabela_sem_rls`, `rls_sem_policy`, `cron_falhando` (≥ 5 % em 7 dias),
`cron_sem_execucao`, `cron_parado`, `historico_cron_sem_limpeza`, `edge_sem_deploy`,
`edge_publicada_sem_codigo`. `tabelas_orfas` = 0 linhas + não citada em função/view + nenhum `.from()` no
código; partição (`particao_de` preenchido) nunca entra.

**`gerar-rotas.mjs`** — lê as `<Route>` de `src/App.tsx` (lazy e import estático, `ProtectedRoute` com
`requiredRole`/`requiredRoles`, `Navigate`, rota aninhada, `index`, `*`; rota comentada não conta) e os itens
`{ title, url }` do menu lateral. Para cada URL com página, segue os imports (pasta da página, `src/hooks`,
`src/services`, `src/lib`, `src/features`, `src/utils` e até 3 saltos em `src/components`, sem `ui/`) e lista
hooks, tabelas, RPCs, buckets e edge functions. `problemas`: `menu_sem_rota`, `rota_sem_menu` (só rota
protegida e estática), `url_sem_arquivo`, `pagina_sem_rota` (arquivo de `src/pages/` que nenhuma rota
alcança) e `import_quebrado`. Saída sem data e ordenada sem locale: o mesmo código gera o mesmo arquivo.
Se as rotas ou o menu mudarem de arquivo, ajuste `ARQUIVO_ROTAS`/`ARQUIVO_MENU` no topo do script — ele
falha (exit 2) em vez de gravar um inventário vazio.

**`gerar-repo.mjs`** — para cada pasta de `supabase/functions/` com `index.ts` (sem `_shared`): linhas do
`index.ts`, segredos (`Deno.env.get('X')` no `index.ts` e nos arquivos locais que ele importa, inclusive
`_shared/`) e em quantos arquivos é chamada (`src`, migrations, outras edges, e2e, CI/`config.toml`).
`sem_chamador` = ninguém em `src`, migrations ou outras edges. O nome é casado inteiro: `health` não herda
as chamadas de `health-check`.

**`mudou-conteudo.mjs`** — compara cada arquivo com o `HEAD` depois de tirar `medido_em`/`gerado_em`, a
telemetria viva do cron (execuções, falhas, horas paradas, tamanho do histórico) e a ordem das chaves.
Arquivo novo ou apagado conta como mudança. Sem `git`, fora de um repositório ou com `.json` gerado
vazio/truncado sai com exit 2 e stdout vazio (o passo da CI falha em vez de abrir PR no escuro).
Contagem de linhas e tamanho de cada tabela **contam** como mudança: num banco vivo isso dá `true` quase
toda semana.

## Limites conhecidos

- `.from(variavel)`, `Deno.env.get(variavel)` e `path={EXPRESSAO}` não são resolvidos (o último aparece cru
  em `urls`, para não sumir).
- "Chamador" é busca por texto: achar não prova execução; não achar não prova que não haja consumidor
  externo (webhook, cron de fora).
- `banco.sql` exige `pg_cron` e o ledger de migrations; num banco sem eles a consulta falha inteira.

## Testes

```sh
node --test scripts/inventario/*.unit.mjs
```

Offline, sem credencial, alguns segundos; cada caso monta um repo sintético em pasta temporária e roda os
scripts lá (nada é escrito neste repo). `gerar-repo.unit.mjs` precisa de `rg`; `mudou-conteudo.unit.mjs`, de
`git`. Para exercitar o `banco.sql` num Postgres de verdade (opcional, **nunca produção** — o teste recria o
schema `public`, e só aceita `127.0.0.1`):

```sh
INVENTARIO_PG_TEST_URL=postgres://postgres@127.0.0.1:5432/banco_descartavel \
  node --test scripts/inventario/gerar-banco.unit.mjs
```

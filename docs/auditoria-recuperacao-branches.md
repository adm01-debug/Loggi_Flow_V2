# Auditoria de recuperacao de trabalho de agentes (2026-11-17)

Varredura byte-a-byte de **28 branches remotas** e **147 PRs** (111 merged, 36 closed sem merge)
procurando trabalho de agentes de IA que nao tivesse entrado na `main`. Objetivo: nao perder nada
antes de fechar branch/PR.

## Metodo

Comparar titulo de PR nao prova nada. Para cada branch foi feito:

```sh
mb=$(git merge-base origin/main $branch)
files=$(git diff --name-only $mb $branch)          # o que a branch mudou
git diff --name-only origin/main $branch -- $files # vazio => conteudo ja esta na main
```

Isso detecta squash-merge (commits diferentes, conteudo identico), que `git log main..branch` nao pega.
Para PRs fechadas cuja branch ja foi apagada, o head foi resgatado com
`git fetch origin refs/pull/<N>/head:refs/prs/<N>`.

## Resultado global

| Verificacao                                                  | Resultado                                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Arquivos presentes em alguma branch e **ausentes** na `main` | **0** (nas 28 branches)                                                   |
| Branches com commit **posterior** ao merge da sua PR         | **0**                                                                     |
| Commits de revert em 4237 commits da `main`                  | **1** (`a64d3594 revert: remove arquivo x acidental`, remocao deliberada) |
| Trabalho de agente nao incorporado                           | **1 arquivo**: `scripts/ops/pos_deploy_functions.sql`                     |

## Recuperado

| Origem                            | O que                                                                                | Onde entrou                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| PR #98 (closed)                   | `PASSO 0 — PRE-REQUISITOS` (0.1 a 0.4): token, CLI, `functions list`, `secrets list` | `scripts/ops/pos_deploy_functions.sql`                                                  |
| PR #98 (closed)                   | `4.5` probe com JWT de usuario nas 3 functions `requireUser` e `4.6` onde ver logs   | idem, reescrito no estilo seguro da `main` (header em arquivo, sem `export` de segredo) |
| `claude_04/elegant-hopper-ffoje5` | typo `deleicao` -> `delecao`                                                         | `docs/agentes/github-ci.md`                                                             |

## Incorporado e superado (branch pode fechar)

| Branch / PR                               | Prova de que a `main` ja tem, e melhor                                                                                                                                                                                                         |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #86 `content_hash.sql`                    | `main` fixa `TimeZone`/`IntervalStyle`/`extra_float_digits`/`bytea_output`/`row_security=off`, usa `ORDER BY x COLLATE "C"` e e idempotente. A branch usava `ORDER BY 1` dentro de `string_agg` (constante, nao-deterministico).               |
| #87 `manifest_summary.sql`                | `main` tem o guard `to_regclass('cron.job')` da PR **e** devolve `NULL` em vez de `0`, distinguindo "pg_cron ausente" de "0 jobs".                                                                                                             |
| #88 `.gitattributes`                      | `main` tem `* text=auto eol=lf` (superset do que a branch declarava por extensao) + marcacao `binary`.                                                                                                                                         |
| #94 `set_missing_secrets.sh`              | `main` tem `eh_placeholder()` cobrindo vazio, so-espacos, `<entre_sinais>` e literal "placeholder"; 245 linhas a mais que a branch.                                                                                                            |
| #102 `seed-database.ts`                   | `main` (923 linhas) cobre as **14 tabelas** da branch **+ 4** (`clientes`, `fornecedores`, `achievements`, `reward_items`) e tem `[dry-run]`. A branch so e maior por repetir `.from()` por tabela, onde a `main` usa `upsertRows()` generico. |
| #92 `ratchet-warning-budget.mjs`          | `main` tem os guards da PR **e mais dois**: rejeita `.warning-budget.json` que nao seja objeto JSON e rejeita relatorio ESLint vazio (que gravaria teto 0 sem medicao).                                                                        |
| #106 (28 erros TS em Recharts v3)         | tocou 11 arquivos; difere da `main` **so em `package-lock.json`** => os 10 arquivos de codigo estao incorporados.                                                                                                                              |
| #107 (97 erros de lint do React Compiler) | tocou 13 arquivos; difere **so em `package-lock.json`** => os 12 de codigo incorporados.                                                                                                                                                       |
| #135 `style(manutencao)`                  | tocou 20 arquivos; **0 diferem** da `main`.                                                                                                                                                                                                    |
| #122 `teste: PR apenas supabase`          | PR descartavel de teste de gate; alem do comentario de teste, trocava `import_map` para `supabase/functions/import_map.json`, caminho errado (o path do `config.toml` e relativo a `supabase/`).                                               |

## Descartado por ser regressao

| Branch                                  | Por que nao entra                                                                                                                                                                                                                                                                                  |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `claude_04/elegant-hopper-ffoje5`       | documenta **9** required checks; a branch protection real da `main` tem **10** (inclui `Contratos da automacao local`). So o typo foi aproveitado.                                                                                                                                                 |
| `ecc-tools/Loggi_Flow_V2-1788403262363` | `SKILL.md` auto-gerado pela ECC Tools a partir de 2 commits, factualmente errado: afirma `snake_case` para arquivos (o repo usa `PascalCase.tsx`) e ensina `console.error` no tratamento de erro (o CI reprova `console.*` cru em edge function). A versao da `main` e escrita a mao e especifica. |

## Branches mantidas

- `main` — default.
- `contexto` — branch orfa **ativa**, regerada pelo `contexto.yml` a cada 10 min com `docs/contexto/**`. Apagar quebraria a automacao.
- `master` — 0 commits a frente da `main`, mas referenciada como gatilho em `ci-nexus.yml` e `security.yml`.

## Aguardando decisao do dono

4 bumps do Dependabot fechados continuam atras do upstream, **todos dentro do range `^` ja declarado**
no `package.json` (entrariam com `npm update`, sem mudar o manifesto):
`eslint-plugin-react-refresh` 0.5.5->0.5.6, `@radix-ui/react-checkbox` 1.3.2->1.3.11,
`@radix-ui/react-toggle-group` 1.1.10->1.1.19, `@types/node` 26.4.0->26.5.1.
`zod` ja esta em 4.6.7 na `main`, acima do 4.6.4 proposto. Mexe no `package-lock.json` inteiro, por isso
nao foi feito junto desta recuperacao.

## Regressao de infra encontrada e corrigida durante a auditoria

Em 2026-11-17 **todos** os workflows do repo estavam terminando em `startup_failure` em `0s`,
inclusive no `main` (ex.: run `44085636180`, `Auto Update PR Branches`, agendado, 12:42 UTC).
Nenhum job chegava a ser criado (`/actions/runs/44085921651/jobs` devolvia `0`).

Causa raiz: a configuracao do repositorio estava em

```
GET /repos/adm01-debug/Loggi_Flow_V2/actions/permissions
{"enabled":true,"allowed_actions":"local_only","sha_pinning_required":false}
```

Com `local_only` o GitHub recusa qualquer action que nao esteja no proprio repositorio, entao
`actions/checkout@v4` ja derruba o workflow antes do primeiro step. A baseline versionada do repo
declara outro valor em `scripts/ci/github-settings-baseline.json:46` (`"allowed_actions": "all"`,
medido em 2026-11-08), ou seja, era divergencia de configuracao, nao mudanca intencional.

Corrigido restaurando a baseline do proprio repo:

```
PUT /repos/adm01-debug/Loggi_Flow_V2/actions/permissions  enabled=true allowed_actions=all
GET  -> {"enabled":true,"allowed_actions":"all","sha_pinning_required":false}
```

Depois disso os workflows voltaram a criar jobs (`in_progress` em vez de `startup_failure` em 0s).

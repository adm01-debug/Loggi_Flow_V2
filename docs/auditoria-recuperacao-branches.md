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

## Branches deletadas (2026-11-17)

Criterio aplicado antes de cada delecao, nas **26** branches avaliadas:

1. `git diff --name-only $(git merge-base origin/main $b) $b` -> lista o que a branch mudou;
2. para cada arquivo, `git cat-file -e origin/main:$f` -> **nenhum** arquivo estava ausente na `main`;
3. os arquivos que ainda divergiam tiveram o diff lido a mao e foram classificados nas tabelas acima.

Resultado da varredura final: `TOTAL A AVALIAR: 26` / zero linhas `AUSENTES NA MAIN`.

25 branches apagadas via `DELETE /repos/.../git/refs/heads/<nome>`:

- `claude/fix-content-hash-20261107-1223`
- `claude/fix-manifest-summary-pgcron-20261107-1226`
- `claude/infra-gitattributes-eol-20261107-1228`
- `claude/fix-set-missing-secrets-guard-20261107-1424`
- `claude/auditoria-tecnica-sistema-gs1hbc`
- `claude/ci-workflows-scripts-261109-2339`
- `claude/feat-port-scripts-automacao-261108-1520`
- `claude/fix-scripts-robustez-261109-2304`
- `claude/chore-manutencao-local-261110-0831`
- `claude/system-status-roadmap-ncpven`
- `claude/chore-recupera-passo0-runbook-261117-0945` (apagada no merge da #155)
- `claude_04/elegant-hopper-ffoje5`
- `Github_Copilotfix-seed-database-hardening`
- `Github_Copilotchore-runbook-pos-deploy-functions-20261`
- `cutover-config`
- `ecc-tools/Loggi_Flow_V2-1788403262363`
- `fix/lockfile-sync-esbuild`
- `fix/security-tests-timeout`
- `computador_local`
- `dependabot/github_actions/github/codeql-action/init-4.39.3`
- `dependabot/github_actions/peter-evans/create-pull-request-8.1.2`
- `dependabot/npm_and_yarn/eslint-plugin-react-refresh-0.5.6`
- `dependabot/npm_and_yarn/radix-ui/react-checkbox-1.3.11`
- `dependabot/npm_and_yarn/radix-ui/react-toggle-group-1.1.19`
- `dependabot/npm_and_yarn/types/node-26.5.1`
- `dependabot/npm_and_yarn/zod-4.6.4`

As duas branches do Dependabot de **github-actions** foram lidas antes de apagar e eram regressao,
nao upgrade:

- `codeql-action/init-4.39.3` bumpava so o `init`; o `analyze` voltava de
  `v4.39.3` (estado da `main`) para `v4.39.1`.
- `create-pull-request-8.1.2` reordenava os steps do `types-sync.yml` e truncava a mensagem de erro
  de `DESTINO_URL`, que na `main` explica onde configurar o secret.

Restaram so `main`, `contexto` (orfa, regerada pela automacao) e `master` (gatilho de
`ci-nexus.yml` e `security.yml`).

## Fase 2 - trabalho inacabado dentro da `main`

A fase 1 cobriu "nao perder trabalho de branch". Faltava a outra metade do pedido:
**terminar o que outro agente comecou** - inclusive o que ja esta mergeado na `main` pela metade.

Varredura no commit `8071e4a5`:

```
git grep -nI -E "TODO|FIXME|WIP|XXX|HACK|@ts-ignore|placeholder-|mock" -- src supabase/functions
```

A maioria dos resultados e mock legitimo de teste (`*.test.ts`, `*.spec.ts`, `setup.ts`) ou a palavra
`TODOS` em portugues. Sobraram 3 candidatos em codigo de producao:

| Arquivo                                                          | Veredito                                                                                                                                                                                      |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/dashboard/MissionDetail.tsx:70` (`mockTimeline`) | **Falso positivo.** Apesar do nome, deriva de dados reais (`shipment.events[0].timestamp`, `previsao`, `dataEfetiva`, `status`). Nome ruim, comportamento correto - nao mexido (diff minimo). |
| `src/components/analytics/AnalyticsCharts.tsx:26`                | **Aceitavel.** O fallback usa zeros (`entregas: 0, slaAtingido: 0`); nao inventa numero.                                                                                                      |
| `src/components/map/MapIntelligenceOverlay.tsx`                  | **Trabalho parcial real - terminado nesta fase.**                                                                                                                                             |

### `MapIntelligenceOverlay` - telemetria inventada apresentada como real

O painel era renderizado **sempre** sobre o mapa real (`LogisticsMapWidget.tsx:1078`) e exibia
valores fixos no codigo: `Grid_Efficiency 98.4%`, latencia `12ms`, `mockSystemLoad` com array
constante, `Atencao em Rota B-12 / 04:12m`, `Bio_Sync ACTIVE`, `DEEP_ENCRYPTION_ON`,
`SLA_Integrity PROTECTED_MODE / OK`. Nada vinha do banco.

Decisao: **ligar a dados reais em vez de remover** (remover seria perda de funcionalidade).

Criado `src/hooks/logistics/useMapIntelligence.ts`, que le `entregas` dos ultimos 30 dias
(`deleted_at is null`) e calcula:

| Campo exibido antes                     | Passa a mostrar                                                                                       |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `Grid_Efficiency 98.4%`                 | `SLA_30d` = % de finalizadas (`entregue`/`finalizado`) com `data_entrega_efetiva <= previsao_entrega` |
| `mockSystemLoad` (sparkline fixa)       | 10 buckets diarios reais de `created_at`                                                              |
| `Latencia 12ms`                         | latencia real da consulta ao Supabase (`performance.now()`)                                           |
| `Bio_Sync ACTIVE`                       | `Em rota: N` (`despachado`/`em_transito`/`saiu_entrega`)                                              |
| `Atencao em Rota B-12 / 04:12m`         | entrega em rota com maior atraso, ou "Nenhuma rota em atraso"                                         |
| `Security_Integrity DEEP_ENCRYPTION_ON` | `Ocorrencias abertas: N`                                                                              |
| `SLA_Integrity PROTECTED_MODE / OK`     | `OK` >=95, `ATENCAO` >=85, `CRITICO` abaixo, `SEM_BASE` sem dados                                     |

Sem base de calculo o painel mostra `--` / `SEM_BASE` - preferivel a um numero falso.
O visual (classes, animacoes, icones) foi preservado integralmente.

Validacao: `tsc --noEmit` exit 0 - `eslint` 0 erros e 0 warnings - `vitest run` 259/259 em 30 arquivos.

---

## Fase 2, item 2 - alertas reais invisiveis na home (PR #158)

A varredura seguinte encontrou um bug de **perda de informacao**, nao so de aparencia.

`src/components/dashboard/AlertsPanel.tsx:59` (antes):

```ts
// Mocking delta calculation for demonstration if not present
const delta = alert.delta || Number(alert.id.charCodeAt(0)) % 20;
return delta >= threshold;
```

Como os ids sao gerados com prefixo fixo em `useDashboardMetrics`, o "delta" era deterministico.
Com o limiar padrao 5:

| prefixo do id                          | letra | delta inventado | resultado no padrao |
| -------------------------------------- | ----- | --------------- | ------------------- |
| `divergencia-*`                        | `d`   | 0               | **nunca aparecia**  |
| `falha-frete-*`                        | `f`   | 2               | **nunca aparecia**  |
| `ia-pred-*`                            | `i`   | 5               | aparecia            |
| `ocorrencia-*`                         | `o`   | 11              | aparecia            |
| `sla-*`                                | `s`   | 15              | aparecia            |
| `variacao-frete-*`                     | `v`   | 18              | aparecia            |
| `coleta-atrasada-*` / `coleta-prazo-*` | `c`   | 19              | aparecia            |

Ou seja, **toda divergencia de coleta e toda falha de integracao de cotacao estavam ocultas**
na home (`src/pages/Index.tsx:282`).

Correcao: `src/components/dashboard/alertsFilter.ts` com `filtrarPorLimiar` - o limiar vale so
para alerta com `delta` medido; alerta sem delta nunca e escondido. A funcao ficou em modulo
proprio porque exporta-la do `.tsx` gera `react-refresh/only-export-components`, que reprova no
Warning Budget Gate.

Segundo ponto, `src/hooks/analytics/useDashboardMetrics.tsx:262` (antes):

```ts
const delta = Math.abs((val % 50) - 25) * 2; // Simulated delta
```

`valor_cotado % 50` nao mede variacao: R$ 1.000,00 dava `delta 50` e disparava alerta de alta
variacao; R$ 1.025,00 dava `delta 0` e nunca disparava. Passou a comparar o valor cotado com a
**media das ultimas cotacoes**, com base minima de 3 cotacoes e disparo acima de 30% de desvio.

Validacao: `tsc --noEmit` exit 0 - `eslint` 0/0 - `vitest run` 263/263 em 31 arquivos.

---

## Fase 2, item 3 - previsao de frete inventada (PR #159)

`src/components/freight/AIFreightForecasting.tsx:12` era 100% fabricado e aparecia na aba
"Previsao IA" de `src/pages/InteligenciaFrete.tsx:238` com o selo "IA Gemini":

```ts
// Mock data for AI Forecasting
const data = [
  { name: "Jan", real: currentTotal * 0.8, pred: currentTotal * 0.82 },
  ...
];
```

A curva inteira era o total atual multiplicado por constantes, e os 3 "insights" eram texto fixo:
"Pico de Demanda Junho", "IA detectou oportunidade de reduzir 12% em SC/PR via transportadora
local ABC" e "Frente fria prevista para Sudeste". Nao havia Gemini nem integracao de clima no
projeto - `git grep -i gemini` nao retorna nada em `src`.

Decisao: ligar a dados reais, preservando o visual.

Criado `src/lib/freightForecast.ts` (puro e testavel):

| Funcao                | O que faz                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| `serieHistoricaFrete` | soma `valor_frete` por mes de calendario, do primeiro mes com dado ate o mes atual, maximo 6 meses            |
| `projetarTendencia`   | regressao linear por minimos quadrados; nunca devolve valor negativo                                          |
| `montarPrevisaoFrete` | historico + 3 meses projetados, ancorados no ultimo ponto real; **sem projecao com menos de 3 meses de base** |
| `gerarInsightsFrete`  | insights derivados de `abusiveFreights`, `consolidationOpportunities`, `bestCarrierPerState` e da tendencia   |

O componente passou a receber `entregas`, `abusivos`, `consolidacao` e `melhorTransportadora` -
todos ja calculados por `useFreightIntelligence`, sem query nova. Sem frete registrado, mostra
estado vazio honesto; sem desvio relevante, diz que nao ha desvio em vez de inventar insight.
O selo "IA Gemini" virou "Tendencia - N meses de base".

Validacao: `tsc --noEmit` exit 0 - `eslint` 0/0 - `vitest run` 277/277 em 32 arquivos
(14 testes novos em `src/lib/freightForecast.test.ts`).

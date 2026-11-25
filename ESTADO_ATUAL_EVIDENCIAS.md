# EVIDÊNCIAS — Auditoria de Estado do LogiFlow

> **ATENCAO - DOCUMENTO HISTORICO**: as evidencias deste anexo foram colhidas no banco
> `hgicfqjayrjurivtygqf` (Lovable Cloud), onde **agentes nao podem escrever**; o banco oficial e
> `jvfhclubfpxrtrrazrgr`. A medicao e de **16/08/2026**, sobre o commit `513ab5a`, e **nao descreve o
> estado atual**. Para o retrato mais recente use `docs/prod-readiness.md`; para a auditoria que
> levantou estes achados, `docs/qa/03-ACHADOS.md`.

> Anexo de detalhe de [`ESTADO_ATUAL.md`](./ESTADO_ATUAL.md).
> Executado em 16/08/2026 · commit `513ab5a` · branch `main` · projeto Supabase `hgicfqjayrjurivtygqf`.
> Contém os comandos, respostas e contagens que sustentam cada afirmação do documento executivo.

---

## 1. RECONTAGEM DE COBERTURA

Contagem feita sobre a árvore real, não sobre autodeclaração.

| Escopo                                            |  Arquivos |  Linhas |
| ------------------------------------------------- | --------: | ------: |
| `src/**/*.{ts,tsx}`                               |       646 | 115.417 |
| `supabase/functions/**/*.ts`                      |       109 |  11.520 |
| `supabase/migrations/*.sql`                       |       230 |  13.454 | (em 16/08/2026; **250** em 2026-11-23 — etapa 243) |
| `tests/**`                                        |        11 |       — |
| `.github/**`                                      |         4 |       — |
| `scripts/*.mjs`                                   |         5 |       — |
| **Total rastreável**                              | **1.005** |       — |
| `docs/**` (tratado como hipótese, não como fonte) |        49 |       — |
| `public/**`                                       |         9 |       — |
| Configuração na raiz                              |        13 |       — |

### Maiores concentrações em `src/`

| Diretório                    | Arquivos | Linhas |
| ---------------------------- | -------: | -----: |
| `src/pages` (raiz)           |       59 | 27.644 |
| `src/hooks/logistics`        |       39 |  7.305 |
| `src/components/ui`          |       55 |  6.800 |
| `src/integrations/supabase`  |        2 |  6.588 |
| `src/components/dashboard`   |       16 |  5.240 |
| `src/components/common`      |       45 |  5.041 |
| `src/components/security`    |       25 |  3.927 |
| `src/components/rodonaves`   |       17 |  3.399 |
| `src/components/melhorenvio` |       18 |  3.305 |
| `src/lib/rodonaves`          |       15 |  2.769 |
| `src/components/freight`     |       18 |  2.673 |
| `src/hooks/common`           |       20 |  2.576 |
| `src/components/predictions` |       13 |  2.322 |

### Detecção de órfãos

Método revisado na segunda rodada. O detector original casava `@/pages/…`, mas o `App.tsx` usa
imports **relativos** (`./pages/…`) — falso-negativo do mesmo tipo que este relatório alerta. A
verificação definitiva faz o parse dos 61 `lazy(() => import("./pages/…"))` e cruza com a árvore:
**0 imports apontando para arquivo inexistente** e **0 componentes lazy sem `<Route>`**. Os 17
arquivos sob `src/pages/*/` são subcomponentes, todos importados por suas páginas-mãe.

| Categoria                | Sem nenhum referenciador                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| Páginas (`src/pages/**`) | **0 de 80**                                                                                |
| Hooks (`src/hooks/**`)   | **2 de 121** — `src/hooks/ai/useNexusSimulator.ts`, `src/hooks/security/useSelfHealing.ts` |

> Os 3 arquivos `.test.ts` que apareceram na varredura bruta foram descartados: testes não precisam
> de referenciador, são executados por _runner_.

---

## 2. RUNTIME — O QUE FOI POSSÍVEL MEDIR

### 2.1 Discriminador correto para "Edge Function implantada"

Este foi o ponto onde uma conclusão inicial **estava errada**. Registro do método corrigido:

| Situação                                | Resposta observada                                                       |
| --------------------------------------- | ------------------------------------------------------------------------ |
| Função **inexistente**                  | `{"code":"NOT_FOUND","message":"Requested function was not found"}`      |
| Função **implantada**, payload inválido | erro de aplicação próprio — ex.: `{"error":"Route not found","path":""}` |

O status HTTP **não serve** como discriminador: `lalamove-api` responde `404` porque o roteador
interno da própria função não casou a rota (`supabase/functions/lalamove-api/index.ts:155`).

Prova adicional de que `lalamove-api` executa: com payload de rota válido, ela avança até a lógica
de requisição à Lalamove e falha adiante —
`{"error":"Cannot read properties of undefined (reading 'map')","circuitOpen":false}`.
O campo `circuitOpen` indica que o _circuit breaker_ também está ativo.

### 2.2 Resultado da sondagem completa

Varredura das 43 funções do repositório usando o discriminador correto:

```
TOTAL funcoes no repo: 43
NAO deployadas: 0
Deployadas: 43
```

**Zero drift no sentido repo → ambiente.**

**Mas o drift inverso existe.** A sondagem só cobria funções que estão no repositório, o que por
construção não detecta código vivo sem fonte versionada. Testando a direção contrária:

| Função           | No repo? | Viva?   | Resposta                                                            |
| ---------------- | -------- | ------- | ------------------------------------------------------------------- |
| `migrate-helper` | **não**  | **não** (404 em 25/11) | estava viva até 25/11/2026 (`{"error":"unauthorized"}`); hoje, `{"code":"NOT_FOUND"}` |
| `mcp-query`      | não      | não     | `{"code":"NOT_FOUND","message":"Requested function was not found"}` |

`migrate-helper` executava em produção sem fonte no repositório; em 25/11/2026 a sonda devolveu 404, então o
drift inverso hoje é **0** e o que a função fazia está versionado em `scripts/ops/backup_origem.sh`. Ver
`ESTADO_ATUAL.md` §3/R3.

### 2.3 A ferramenta MCP estava desatualizada

`functions_list` do MCP retorna **23** funções — contra 43 que de fato respondem. Exemplos ausentes
da lista do MCP mas **vivos**: `geocode-address`, `scheduled-reports`, `ocr-receipt-processor`,
`rodonaves-api`, `nexus-auto-healing`, `db-health-snapshot`, `ingest-biosync`, `validate-login`,
`lgpd-erase-user`. A lista do MCP é estática e está desatualizada.

Sobre `mcp-query`, o MCP acertou: reporta `deployed: false`, e a sondagem confirma `NOT_FOUND`.
É essa ausência que inviabiliza todas as ferramentas SQL do MCP e origina os `NAO_VERIFICADO`
desta auditoria.

> Lição de método aplicada: a regra "medir, não confiar" vale também para a ferramenta de medição.

### 2.4 Saúde real do ambiente

```
GET /functions/v1/health
{"status":"healthy","version":"1.0.0-enterprise","total_latency_ms":776,
 "services":{"database":{"status":"healthy","latency_ms":548},
             "auth":{"status":"healthy"},
             "storage":{"status":"healthy","buckets_count":2}}}

GET /functions/v1/health-check
{"status":"healthy","checks":{"database":true,"storage":true,"auth":true},
 "version":"1.2.0-nexus-shield"}

POST /functions/v1/nexus-auto-healing
{"success":true,"repairs_executed":0,"latency_ms":147,
 "message":"Sistema 10/10: Nenhuma inconsistência detectada."}

POST /functions/v1/db-health-snapshot
{"ok":true,"snapshot":{"created_at":"2026-08-16T18:00:02.374277+00:00",
 "active_connections":1,"total_connections":9,"db_size_bytes":80727187,
 "cache_hit_ratio":99.91,"deadlocks":0,"wal_size_bytes":83886484}}
```

O banco tem **~80 MB** e `cache_hit_ratio` de 99,91% — é um ambiente com dados reais em uso, não
uma instalação vazia.

### 2.5 Postura de segurança verificada

RPCs sensíveis testados com a chave _publishable_ (papel `anon`):

| RPC                            | Resposta                                 | Leitura                   |
| ------------------------------ | ---------------------------------------- | ------------------------- |
| `system_health_check`          | `42501 permission denied`                | ✅ fechado                |
| `get_dashboard_metrics`        | `42501 permission denied`                | ✅ fechado                |
| `get_leaderboard`              | `42501 permission denied`                | ✅ fechado                |
| `get_cron_jobs_status`         | `42501 permission denied`                | ✅ fechado                |
| `get_global_health_score_fast` | `42501 permission denied`                | ✅ fechado                |
| `record_heartbeat`             | `42501 permission denied`                | ✅ fechado                |
| `exec_sql`                     | `PGRST202` — não exposto no schema cache | ✅ não alcançável via API |

Tabelas sensíveis também negam `anon`: `profiles`, `audit_logs`, `feature_flags` (via
`permission denied for function has_role`), `organizations` e `transportadoras` (sem `GRANT SELECT`).

### 2.6 Por que a contagem de linhas ficou `NAO_VERIFICADO`

Sondagem com `Prefer: count=exact` sobre as 130 tabelas/partições e 4 views produziu três respostas
distintas — e apenas uma delas é conclusiva:

| Resposta                       | Significado                             | Conclusivo?                                          |
| ------------------------------ | --------------------------------------- | ---------------------------------------------------- |
| `206` + `content-range: 0-0/N` | N linhas visíveis a `anon`              | ✅ sim — há dados                                    |
| `401` + `42501`                | permissão negada                        | ❌ não — nada se pode dizer                          |
| `200` + `content-range: */0`   | consulta permitida, 0 linhas retornadas | ❌ **não** — pode ser RLS filtrando por `auth.uid()` |

**Nenhuma afirmação de "tabela vazia" foi feita nesta auditoria.** O terceiro caso é ambíguo por
construção quando a política é baseada em `auth.uid()`, e tratá-lo como "vazio" seria fabricar
evidência.

### 2.7 Dados reais efetivamente observados (206)

| Tabela                    | Linhas visíveis | Amostra                                                                                             |
| ------------------------- | --------------: | --------------------------------------------------------------------------------------------------- |
| `achievements`            |               6 | `onboarding_profile`, `first_delivery`, `speed_demon`, `box_master`, `streak_7`, `onboarding_setup` |
| `user_ranks`              |               5 | `Cadete Logístico` (nível 1, ×1.0), `Especialista de Rota` (nível 5, ×1.1)                          |
| `freight_selection_rules` |               3 | `Normal` (SLA 15d, preço 0.7/tempo 0.2/perf 0.1, _default_), `Urgente` (SLA 5d, 0.2/0.6/0.2)        |
| `system_heartbeat`        |               4 | ver §3                                                                                              |
| `bio_sync_alert_rules`    |               1 | —                                                                                                   |

---

## 3. HEARTBEAT — MEDIÇÃO E RESSALVA

### 3.1 Observação

Duas leituras espaçadas, sem nenhuma chamada intermediária a `/health`:

```
18:53:25Z  database=2026-08-16T18:53:25.548Z  edge_functions=2026-05-19T16:54:35.333884Z
           storage=2026-05-19T16:54:35.333884Z  auth=2026-05-19T16:54:35.333884Z

18:58:33Z  (idêntico — nenhuma linha atualizada em 5 minutos)
```

O cron declarado é `system-heartbeat-1m` com frequência `* * * * *`
(`supabase/migrations/20260712110849_*.sql:53`). **Nenhuma atualização em 5 minutos.**

O timestamp de `database` (18:53:25.548) coincide com a chamada que este auditor fez a
`/functions/v1/health` às 18:53:24–25 — ou seja, foi **a sondagem** que atualizou a linha, não o cron.

### 3.2 Causa provável, versionada no repositório

`supabase/migrations/20260711153319_785edc4c-3e2b-4a6e-895e-7ee382fe4946.sql:43`

```sql
CREATE OR REPLACE FUNCTION public.record_heartbeat()
...
  INSERT INTO public.system_heartbeat (status, message, checked_at)
  VALUES ('healthy', 'auto-heartbeat', now());
  DELETE FROM public.system_heartbeat WHERE checked_at < now() - INTERVAL '30 days';
```

As colunas `message` e `checked_at` **não existem**. Três fontes independentes:

1. `GET /rest/v1/system_heartbeat?select=checked_at` → `42703: column system_heartbeat.checked_at does not exist`
2. `GET /rest/v1/system_heartbeat?select=message` → `42703: column system_heartbeat.message does not exist`
3. `src/integrations/supabase/types.ts` declara apenas: `service_name`, `status`, `latency_ms`, `last_check`, `version`, `metadata`

Os outros dois arquivos que citam `record_heartbeat`
(`20260711183644_*.sql`, `20260711192237_*.sql`) contêm apenas `GRANT`/`REVOKE` — **não há redefinição
posterior do corpo da função** no repositório.

### 3.3 Ressalva explícita

Sem acesso SQL não foi possível ler o corpo da função **viva** (`\sf public.record_heartbeat`).
O que está **provado**: (a) a versão do repositório é incompatível com o schema vivo; (b) o
heartbeat não atualiza. As duas evidências convergem, mas a confirmação definitiva depende de
leitura do catálogo.

---

## 4. TESTES — O QUE PROTEGE E O QUE NÃO PROTEGE

### 4.1 Resultado da execução local

```
Test Files  30 passed (30)
     Tests  257 passed (257)
  Duration  10.80s
```

Nenhum `.skip`, `.todo` ou `.only` em nenhum arquivo.

### 4.2 Classificação por importação do alvo

Detecção com regex **multi-linha** (a primeira tentativa, limitada a uma linha, produziu falso
negativo em `eventCodes.test.ts`, que importa 11 símbolos em bloco):

| Grupo                               |   Qtd | Avaliação                                                                                                             |
| ----------------------------------- | ----: | --------------------------------------------------------------------------------------------------------------------- |
| Importam código do projeto          |    20 | protegem algo                                                                                                         |
| E2E Playwright (`@playwright/test`) |     2 | legítimos — dirigem o app real; porém o runner (`npm run test:e2e`) só existe em `ci-nexus.yml`, que nunca conclui    |
| Caixa-preta contra Supabase real    |     2 | legítimos — `tests/security/rls-access.spec.ts`, `tests/security/integrations-access.spec.ts` (3.951 ms de rede real) |
| **Testam a si mesmos**              | **7** | **não protegem nada**                                                                                                 |
| Regressão sem import                |     1 | `src/components/security/SecurityOverviewPanel.regression.test.ts`                                                    |

### 4.3 Os 7 testes-espelho, com citação

| Arquivo                                        | O que realmente afirma                                                                                                                                                                                      |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tests/unit/modules-integrity.spec.ts`         | Faz `vi.mock` de `useMelhorEnvio` e `useRodonaves` e então testa `new Date(base + 5*86400000)` e `Math.round(125.5555*100)/100`. Nenhum código do projeto é exercitado.                                     |
| `tests/integration/webhooks.spec.ts`           | Define `simulateWebhookPayload` no próprio arquivo e afirma sobre a saída dela. Comentário no código: `// Simula a validação que seria feita na Edge Function`.                                             |
| `tests/integration/fuzzing.spec.ts`            | Testa um literal de regex de UUID e `JSON.parse` de strings inválidas.                                                                                                                                      |
| `tests/fuzzing/edge-functions.spec.ts`         | **Funcionalmente idêntico** ao anterior — mesmos 2 testes, mesmas asserções; difere apenas em 2 linhas em branco e 1 comentário (MD5 distintos: `5cad21b2…` vs `2cf93ae1…`).                                |
| `tests/integration/massive-simulation.spec.ts` | Anuncia "10.000 cenários"; monta objetos locais em laço com `Math.random()`. Redefine `simulateWebhookPayload` (terceira cópia).                                                                            |
| `tests/contracts/nexus-contracts.spec.ts`      | Declara `CarrierWebhookSchema` e `FreightCalculationSchema` **dentro do teste**, em vez de importar os schemas do projeto → divergência de contrato é indetectável. Também é o arquivo com o erro `TS2554`. |
| `tests/load/backend-stress.spec.ts`            | 100 `setTimeout(Math.random()*50)`. Saída real: `Simulated 100 requests. Avg time: 0.49ms`.                                                                                                                 |

Os 257 testes "passando" incluem o laço de 10.000 iterações de `massive-simulation`, o que infla a
contagem sem aumentar a proteção.

### 4.4 Contraexemplo positivo

`src/lib/rodonaves/eventCodes.test.ts` (266 linhas) é o padrão a seguir: importa 11 símbolos reais
de `./eventCodes`, usa PRNG determinístico (`mulberry32`) para 500 cenários reprodutíveis e afirma
**invariantes** (`isFinal` ⇒ fase `entregue` sem exceção; `step` nunca gera exceção; rótulo nunca
vazio), além de verificar determinismo entre execuções.

---

## 5. CADEIA DE FALHA DAS DEPENDÊNCIAS

### 5.1 Causa raiz única

`package.json` declara:

```
eslint:            ^9.32.0
@eslint/js:        ^10.0.1     ← incompatível
zod:               ^4.4.3
typescript:        ~5.8.3
```

Instalado de fato: `eslint 9.32.0`, `@eslint/js 10.0.1`, `zod 4.4.3`.

### 5.2 Efeito 1 — instalação limpa impossível

```
npm error code ERESOLVE
npm error While resolving: @eslint/js@10.0.1
npm error Found: eslint@9.32.0
```

Como **todos** os jobs de `ci.yml` e o `quality-gate` de `ci-nexus.yml` usam `npm ci` sem
`--legacy-peer-deps`, o pipeline morre antes de qualquer verificação.

### 5.3 Efeito 2 — lint não executa

```
TypeError: Key "rules": Key "preserve-caught-error":
Could not find "preserve-caught-error" in plugin "@".
```

`eslint.config.js:13` usa `js.configs.recommended`, e o preset do `@eslint/js@10` referencia uma
regra que não existe no core do `eslint@9`.

### 5.4 Efeito 3 — 21 erros de typecheck

| Código   | Qtd | Natureza                                                   |
| -------- | --: | ---------------------------------------------------------- |
| `TS7006` |  10 | parâmetro `err` com `any` implícito                        |
| `TS2339` |  10 | `Property 'errors' does not exist on type 'ZodError<…>'`   |
| `TS2554` |   1 | assinatura em `tests/contracts/nexus-contracts.spec.ts:10` |

Distribuição por arquivo: `src/pages/Auth.tsx` (4), `src/pages/auth/AuthForgotPassword.tsx` (2),
`src/pages/ResetPassword.tsx` (2), `src/lib/validations.ts` (2), `src/lib/excelImporter.ts` (2),
`src/lib/csvImporter.ts` (2), `src/hooks/common/useImportData.ts` (2),
`src/components/security/IPAccessControl.tsx` (2), `src/components/common/CSVImporter.tsx` (2),
`tests/contracts/nexus-contracts.spec.ts` (1).

`.warning-budget.json` exige `tsErrors: 0`, `lintErrors: 0`, `lintWarnings: 0` — e o gate que
verificaria isso nunca executa.

### 5.5 Efeito 4 — falha em runtime (o mais grave)

Teste empírico contra a versão instalada:

```js
const r = z.object({ email: z.string().email() }).safeParse({ email: 'x' });
typeof r.error.errors  // undefined
typeof r.error.issues  // object
r.error.errors.forEach(...)
// => TypeError: Cannot read properties of undefined (reading 'forEach')
```

Os 10 pontos listados em `ESTADO_ATUAL.md` §1 executam exatamente esse padrão em caminhos de
usuário: login, cadastro, reset de senha, esqueci-minha-senha, controle de IP e importação de dados.
**O `TS2339` não é ruído de tipo — é um defeito ativo em produção.**

---

## 6. CI — CONCLUSÃO REAL, NÃO O QUE O YAML APARENTA

### 6.1 Amostragem

| Janela                 |    Execuções | Sucessos |
| ---------------------- | -----------: | -------: |
| 16/08/2026 15:24–15:27 |           30 |        0 |
| 16/08/2026 (página 1)  |           20 |        0 |
| 23/07/2026 15:08–16:50 |           30 |        0 |
| 20–22/05/2026          |           30 |    **1** |
| **Total amostrado**    | **~110–120** |    **1** |

O único sucesso é `github_actions in /. - Update #1377016306` — workflow de metadados do próprio
Dependabot, **não** um job de build, lint, typecheck ou teste.

Os três workflows (`CI/CD Pipeline`, `CI Quality Gate Nexus`, `Security Scan`) falham em conjunto a
cada push, desde pelo menos 20/05/2026.

### 6.1-b Três regimes de falha — leitura passo a passo

A conclusão `failure` é a mesma o tempo todo, mas **a causa não é**. Esta distinção só aparece
inspecionando os `steps` de cada job; ler apenas a conclusão do run leva a um diagnóstico errado.

**Regime A — até 16/08 15:2x.** Run `30025705603` (23/07/2026, commit `ad50655`):

| Job                      | Passo                            | Conclusão         |
| ------------------------ | -------------------------------- | ----------------- |
| Type Check               | `Run npm ci`                     | ✅ sucesso (31 s) |
| Type Check               | `Run npm run typecheck`          | ✅ **sucesso**    |
| Lint                     | `Run npm ci`                     | ✅ sucesso (28 s) |
| Lint                     | `Run npm run lint`               | 🔴 falha          |
| Unit & Integration Tests | `Run npm ci`                     | ✅ sucesso (32 s) |
| Unit & Integration Tests | `Run npm run test:coverage`      | 🔴 falha          |
| Warning Budget Gate      | `Enforce lint/TS warning budget` | 🔴 falha          |
| Security Scan            | `Audit Dependencies`             | 🔴 falha          |
| Generate Audit PDF       | `Generate PDF from Markdown`     | 🔴 falha          |

**Regime B — a partir de 16/08 15:2x.** Run `31955665339` (commit `513ab5a`, pós-Dependabot):

| Job                      | Passo                   | Conclusão                        |
| ------------------------ | ----------------------- | -------------------------------- |
| Type Check               | `Run npm ci`            | 🔴 **falha em 1 s** (`ERESOLVE`) |
| Type Check               | `Run npm run typecheck` | ⏭️ `skipped`                     |
| Lint                     | `Run npm ci`            | 🔴 falha em 1 s                  |
| Lint                     | `Run npm run lint`      | ⏭️ `skipped`                     |
| Warning Budget Gate      | `Run npm ci`            | 🔴 falha em 1 s                  |
| Unit & Integration Tests | `Run npm ci`            | 🔴 falha em 1 s                  |

**Regime C — PR #23, 16/08 19:10.** Runs `31966770428` e `31966770434`: os 7 jobs concluem em
**3–5 segundos** com `runner_id: 0` e `runner_name: ""`, **sem nenhum passo registrado**. Não
chegaram a receber runner — modo de falha distinto dos regimes A e B, e não atribuível ao conteúdo
do PR (que altera apenas 2 arquivos `.md`).

> **Correção registrada.** A primeira versão deste relatório atribuiu os ~3 meses de vermelho ao
> `ERESOLVE`. Está errado: o `ERESOLVE` tem horas de idade, não meses. O que é verdade há meses é
> que **nenhum portão conclui**; a razão pela qual não conclui mudou pelo menos duas vezes.

### 6.2 Problemas estruturais nos workflows

| Problema                                                                  | Localização                        |
| ------------------------------------------------------------------------- | ---------------------------------- |
| `npm ci` sem `--legacy-peer-deps` em 6 jobs                               | `.github/workflows/ci.yml`         |
| `npm ci` no `quality-gate`                                                | `.github/workflows/ci-nexus.yml`   |
| `md-to-pdf audit_report.md` — **arquivo inexistente**                     | `ci.yml`, job `generate-audit-pdf` |
| Job faz `git push` direto na branch principal                             | `ci.yml`, job `generate-audit-pdf` |
| Gate de cobertura é apenas `echo` (verificação comentada)                 | `ci.yml`, job `test`               |
| Smoke tests Deno terminam em `\|\| true` — nunca falham                   | `ci-nexus.yml`                     |
| `security.yml` e `ci.yml` rodam `npm audit` **sem instalar dependências** | ambos                              |

O `security.yml` também roda semanalmente (`cron: '0 0 * * 0'`) e falha toda semana.

---

## 7. AGENDAMENTOS (pg_cron)

### 7.1 Jobs versionados no repositório

**Correção.** A primeira versão deste anexo afirmava "oito chamadas `cron.schedule` em 6 migrations".
Estava errado: o `grep` usado só casava a forma de **linha única**, e a maioria das chamadas é
multi-linha. O parse exaustivo (casando o nome, o cron e o corpo entre `$…$`) encontra **15 chamadas
em 8 migrations**. Cinco jobs tinham ficado de fora do relatório: `auto-revert-ineffective-indexes-daily`,
`check-health-score-regression-hourly`, `nexus_notifications_ttl`, `nexus_partition_retention` e
`nexus_telemetry_cleanup`.

Lista completa — **todas SQL puro; nenhuma invoca Edge Function**:

| Job                                     | Cron          | Ação                                                                    |
| --------------------------------------- | ------------- | ----------------------------------------------------------------------- |
| `system-heartbeat-1m`                   | `* * * * *`   | `record_heartbeat()`                                                    |
| `nexus_heartbeat`                       | `*/5 * * * *` | `record_heartbeat()`                                                    |
| `refresh-dashboard-views-5m`            | `*/5 * * * *` | `refresh_dashboard_views()`                                             |
| `check-health-score-regression-hourly`  | `15 * * * *`  | `check_and_alert_health_regression()`                                   |
| `ensure-future-partitions-monthly`      | `0 2 1 * *`   | `ensure_future_partitions()`                                            |
| `nexus_partition_retention`             | `0 3 1 * *`   | `drop_old_partitions('audit_logs','audit_logs_',18)`                    |
| `cleanup-telemetry-daily`               | `0 3 * * *`   | `cleanup_old_telemetry_logs(30)`                                        |
| `nexus_telemetry_cleanup`               | `0 4 * * *`   | `cleanup_old_telemetry_logs(30)`                                        |
| `cleanup-notifications-weekly`          | `0 4 * * 0`   | `cleanup_old_notifications(90)`                                         |
| `nexus_notifications_ttl`               | `0 5 * * 0`   | `cleanup_old_notifications(90)`                                         |
| `snapshot-query-baseline-daily`         | `30 4 * * *`  | `internal.snapshot_query_baseline()`                                    |
| `auto-revert-ineffective-indexes-daily` | `30 4 * * *`  | `auto_revert_ineffective_indexes(24, 5)`                                |
| `reindex-hot-indexes-weekly`            | `0 5 * * 0`   | `internal.reindex_hot_indexes()`                                        |
| `persist-global-health-score-daily`     | `0 6 * * *`   | `persist_global_health_score()`                                         |
| `nexus_slow_queries`                    | `0 6 * * *`   | `alert_slow_queries(500)` — desagendado logo abaixo, na mesma migration |

**Nenhum dos 15 chama `persist_db_health_snapshot()` nem `net.http_post`** — é o que sustenta §7.2.
Note que `persist-global-health-score-daily` chama `persist_global_health_score()`, função distinta.

**Três pares duplicados** (mesma ação, dois jobs): `record_heartbeat`, `cleanup_old_telemetry_logs`
e `cleanup_old_notifications`. Ver `ESTADO_ATUAL.md` §3/R3-b.

_Ressalva:_ isto é o que o repositório **declara**. Sem acesso a `cron.job` não é possível
confirmar quais estão registrados no banco — `NAO_VERIFICADO`.

### 7.2 Agendamento que existe no ambiente mas **não** no repositório

`db_health_snapshots` contém um registro de `2026-08-16T18:00:02Z` — hora cheia, padrão de cron
horário. A função `db-health-snapshot` só persiste quando chamada com `?persist=true`
(`supabase/functions/db-health-snapshot/index.ts:12`), e **nenhuma migration agenda essa chamada**.

O próprio código documenta o agendador que não está versionado —
`supabase/functions/db-health-snapshot/index.ts:5`:

```
// Persiste quando ?persist=true (cron horário) OU retorna somente snapshot atual (painel admin).
```

Ou seja: o autor sabia do cron horário; ele existe no ambiente e nunca entrou no repositório.

> Este é o achado de reconstrutibilidade: **o ambiente não nasce inteiro do repositório.**

### 7.3 Edge Functions de perfil agendado, sem agendador versionado

| Função                     | Chamadores em `src/` | Agendador versionado |
| -------------------------- | -------------------: | -------------------- |
| `predict-delays-scheduled` |                    0 | ✗                    |
| `scheduled-reports`        |                    0 | ✗                    |
| `accuracy-weekly-digest`   |                    1 | ✗                    |
| `db-health-weekly-report`  |                    0 | ✗                    |
| `db-regression-monitor`    |                    0 | ✗                    |
| `accuracy-meta-monitor`    |                    0 | ✗                    |

> Ressalva: `cron.job_run_details` não é acessível sem SQL. Não é possível afirmar se essas
> funções rodam por agendamento configurado fora do repositório. Marcadas `NAO_VERIFICADO`.

---

## 8. DADOS FICTÍCIOS — VARREDURA

13 ocorrências de `Math.random()` em `src/` fora de testes. A maioria é **legítima**. Classificação
honesta, uma a uma:

| Local                                             | Uso                                                   | Veredito                                |
| ------------------------------------------------- | ----------------------------------------------------- | --------------------------------------- |
| `src/hooks/data/useDocumentUpload.ts:80`          | sufixo de nome de arquivo                             | ✅ legítimo                             |
| `src/hooks/data/useImageUpload.tsx:75`            | sufixo de nome de arquivo                             | ✅ legítimo                             |
| `src/hooks/logistics/useSmartAlerts.tsx:40`       | id de alerta                                          | ✅ legítimo                             |
| `src/lib/predictions/whatIfScenarios.ts:106`      | id de cenário                                         | ✅ legítimo                             |
| `src/utils/celebrationSounds.ts:110`              | ruído branco (Web Audio)                              | ✅ legítimo                             |
| `src/components/ui/skeleton.tsx:139`              | altura de _placeholder_ de carregamento               | ✅ legítimo                             |
| `src/components/ui/sidebar.tsx:537`               | largura de _skeleton_                                 | ✅ legítimo                             |
| `src/components/layout/SystemPulse.tsx:53`        | altura de barra decorativa                            | ✅ legítimo                             |
| `src/components/dashboard/LiveStatusBar.tsx:32`   | valor animado na barra de status                      | ⚠️ decorativo, mas exibido como métrica |
| **`src/components/dashboard/KPICard.tsx:343`**    | **exibe `(Math.random()*5+92).toFixed(1)%` como KPI** | 🔴 **métrica fictícia na tela**         |
| **`src/pages/Relatorios.tsx:229`**                | **`eficiencia: 80 + Math.floor(Math.random()*20)`**   | 🔴 **dado fictício em relatório**       |
| `src/hooks/logistics/useDeliveryRoutes.tsx:80-81` | ruído de ±0.15° em `lat`/`lng`                        | 🔴 **coordenadas de entrega falseadas** |
| `supabase/functions/ingest-biosync/index.ts:43`   | `heart_rate` gerado quando ausente                    | 🔴 **telemetria biométrica inventada**  |

**Quatro ocorrências produzem números que o usuário lê como se fossem reais.** Os `placeholder=` de
`MEWebhookPanel.tsx:120` e `IntegracaoBitrix.tsx:411` foram inspecionados e **são atributos de
`<input>`**, não dados falsos — descartados.

---

## 9. SEGREDOS E SUPERFÍCIE EXTERNA

### 9.1 Segredos exigidos pelas Edge Functions

33 variáveis distintas via `Deno.env.get`. Além das 4 do Supabase, por integração:

| Integração    | Segredos                                                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Rodonaves     | `RODONAVES_USERNAME`, `RODONAVES_PASSWORD`, `RODONAVES_CNPJ_REMETENTE`                                                                     |
| Lalamove      | `LALAMOVE_API_KEY`, `LALAMOVE_API_SECRET`, `LALAMOVE_BASE_URL`                                                                             |
| Melhor Envio  | `MELHOR_ENVIO_TOKEN`                                                                                                                       |
| Bitrix24      | `BITRIX24_WEBHOOK_URL`                                                                                                                     |
| WhatsApp      | `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`                                                                                                   |
| E-mail        | `RESEND_API_KEY`                                                                                                                           |
| Mapas         | `MAPBOX_PUBLIC_TOKEN`                                                                                                                      |
| IA            | `LOVABLE_API_KEY`, `OPENAI_API_KEY`                                                                                                        |
| Clima         | `OPENWEATHER_API_KEY`                                                                                                                      |
| Cache         | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`                                                                                       |
| Chamados      | `ATICKET_API_URL`, `ATICKET_API_KEY`                                                                                                       |
| Banco externo | `EXTERNAL_SUPABASE_URL`, `EXTERNAL_SUPABASE_SERVICE_KEY`                                                                                   |
| Segurança     | `FIELD_ENCRYPTION_KEY`, `NEXUS_WEBHOOK_SECRET`, `SECURITY_SLACK_WEBHOOK_URL`, `SECURITY_ALERT_EMAIL`, `ALLOWED_ORIGINS`, `ALLOW_TEST_MODE` |

> `ALLOW_TEST_MODE` aparece em 2 Edge Functions. Se estiver ativo em produção, pode relaxar
> validações — **não verificável sem acesso aos segredos**. Vale uma conferência do dono.

### 9.2 Hosts externos alcançados pelo código

| Host                           | Ocorrências | Papel                                                               |
| ------------------------------ | ----------: | ------------------------------------------------------------------- |
| `*.rte.com.br` (6 subdomínios) |           6 | Rodonaves: tracking, cotação, coleta, pagamentos, DNE, unit-to-city |
| `api.resend.com`               |           5 | e-mail transacional                                                 |
| `viacep.com.br`                |           4 | consulta de CEP                                                     |
| `rest.lalamove.com`            |           2 | Lalamove produção                                                   |
| `rest.sandbox.lalamove.com`    |           1 | Lalamove sandbox                                                    |
| `melhorenvio.com.br`           |           1 | produção                                                            |
| `sandbox.melhorenvio.com.br`   |           1 | sandbox                                                             |
| `api.mapbox.com`               |           2 | mapas                                                               |
| `ai.gateway.lovable.dev`       |           2 | IA                                                                  |
| `api.ipify.org`, `ipapi.co`    |           4 | IP e geolocalização                                                 |
| `wa.me`                        |           3 | links de WhatsApp                                                   |

**Sandbox e produção coexistem** em Melhor Envio (`melhor-envio-api/index.ts:7-8`) e Lalamove
(`lalamove-tracking/index.ts:7-8`). Qual está ativo depende de segredo/flag não legível →
`NAO_VERIFICADO`.

---

## 10. GUARD-RAILS CUMPRIDOS

| Guard-rail                             | Cumprimento                                                                                                                                                                                                                                       |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Produção somente leitura               | ✅ zero DDL, DML, migration ou deploy. Todas as chamadas foram leitura ou `POST` a endpoints de diagnóstico idempotentes (`health`, `health-check`, `nexus-auto-healing` com `repairs_executed: 0`, `db-health-snapshot` **sem** `?persist=true`) |
| Não editar artefatos de outras trilhas | ✅ nenhum arquivo de `docs/` foi alterado; divergências viraram linha de relatório (R7)                                                                                                                                                           |
| Não afirmar resultado não executado    | ✅ typecheck, lint e testes foram efetivamente rodados; E2E **não** foi rodado e está declarado                                                                                                                                                   |
| Não inventar evidência                 | ✅ contagens de linha ficaram `NAO_VERIFICADO` em vez de tratar `*/0` como "vazio"                                                                                                                                                                |
| Trabalhar em branch própria            | ✅ `claude/system-status-roadmap-ncpven`                                                                                                                                                                                                          |
| Corrigir em voz alta                   | ✅ duas conclusões próprias refutadas e registradas em `ESTADO_ATUAL.md` §5.1 e neste anexo §2.1                                                                                                                                                  |

### Nota sobre a toolchain

`node_modules` não existia no ambiente. `npm ci` falha (§5.2); a instalação só foi possível com
`npm ci --legacy-peer-deps` (1.255 pacotes). **Todos os resultados de typecheck, lint e testes deste
relatório vêm dessa árvore instalada com contorno** — que é, justamente, o contorno que o CI não faz.

---

_Anexo de evidências · 16/08/2026 · commit `513ab5a`_

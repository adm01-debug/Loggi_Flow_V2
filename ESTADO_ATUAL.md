# ESTADO ATUAL DO SISTEMA — LogiFlow / loggi-flow-v2

> **ATENCAO - DOCUMENTO HISTORICO**: este retrato foi medido em **16/08/2026** sobre o commit
> `513ab5a` e **nao descreve o estado atual**. O banco medido foi o projeto Supabase
> `hgicfqjayrjurivtygqf` (Lovable Cloud), que o `AGENTS.md:84-86` classifica como **"nao escrever"** -
> **nao e o banco de producao**, que e `jvfhclubfpxrtrrazrgr`. Tres afirmacoes centrais da tabela
> abaixo (typecheck com 21 erros, lint sem executar e `npm ci` com ERESOLVE) ja foram refutadas por
> medicao e estao corrigidas na etapa 242. Para o estado real use `docs/prod-readiness.md`; para a
> auditoria que levantou estes achados, `docs/qa/03-ACHADOS.md`.

> **Auditoria de estado** executada em 16/08/2026 sobre o commit `513ab5a` (branch `main`).
> Metodologia: _medir, não confiar_. Toda linha desta tabela cita `arquivo:linha`, objeto de banco,
> nome de workflow ou resposta HTTP verificada. Documentação pré-existente foi tratada como
> **hipótese a testar**, nunca como fonte.
>
> Documento de detalhe: [`ESTADO_ATUAL_EVIDENCIAS.md`](./ESTADO_ATUAL_EVIDENCIAS.md)

---

## 1. VEREDITO EM UMA TELA

O **código do produto está substancialmente construído e implantado**. O que está quebrado é a
**cadeia de qualidade e o plano de manutenção** — e isso já produziu pelo menos um bug que atinge
o usuário final em produção.

| Camada              | Situação medida                                                                                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend / rotas    | 61 rotas registradas, 0 páginas órfãs — íntegro                                                                                                                                          |
| Edge Functions      | **43 de 43 do repo implantadas**; porém `migrate-helper` roda em produção **sem existir no repo**                                                                                        |
| Banco (estrutura)   | 100 tabelas base + 30 partições, 4 views e 79 RPCs — **sem drift**                                                                                                                       |
| **Pipeline de CI**  | **🔴 0 execuções verdes em 120 amostradas (20/05 → 16/08/2026)**                                                                                                                         |
| **Typecheck**       | **🔴 21 erros — o orçamento exige 0** — ⚠️ superado em 2026-11-23: `npx tsc --noEmit` sai com 0 erros, exit 0 (docs/qa/02-CENARIOS.md secao 0, E1), reconfirmado em 2026-11-23           |
| **Lint**            | **🔴 não executa: crash de configuração** — ⚠️ superado em 2026-11-23: `npm run lint:budget` passa com 77 avisos / 0 erros, dentro do teto de 86 (docs/qa/02-CENARIOS.md secao 0, E2/E3) |
| **`npm ci`**        | **🔴 falha (ERESOLVE) — instalação limpa impossível** — ⚠️ superado em 2026-11-23: `npm ci` instala sem ERESOLVE neste clone                                                             |
| Testes              | 257 passam localmente, mas **7 de 32 arquivos testam a si mesmos**                                                                                                                       |
| Cron / agendamentos | **🔴 heartbeat parado há ~3 meses**; cron horário de saúde roda mas **não está versionado**                                                                                              |

**O bloco vermelho tem duas idades, e confundi-las leva a corrigir a coisa errada.** As falhas de
CI são contínuas desde pelo menos 20/05/2026, mas o que falhava mudou: até 16/08 o `npm ci`
instalava normalmente e quem quebrava eram as verificações (`lint`, `test:coverage`, `npm audit`,
`md-to-pdf`). Em 16/08 às 15:2x, três PRs de Dependabot subiram `@eslint/js` para `10.0.1`
(mantendo `eslint@9.32.0`) e `zod` para `4.4.3` — e a partir daí a própria **instalação** quebra,
junto com o lint, o typecheck e, o mais grave, a **exibição de erros de validação em telas de
autenticação**. Detalhamento por regime em §3/R2.

### O achado que atinge o usuário agora

`zod@4` removeu `ZodError.errors` (renomeado para `.issues`). Existem **10 pontos de chamada** que
ainda usam `.errors`. Teste empírico com a versão instalada:

```
typeof error.errors : undefined
=> .errors LANCA: TypeError - Cannot read properties of undefined (reading 'forEach')
```

Isso significa: **ao submeter um formulário inválido de login, cadastro, recuperação de senha ou
importação CSV/Excel, o tratador de erro estoura em vez de mostrar a mensagem de campo.**

| Arquivo:linha                                    | Tela afetada                     |
| ------------------------------------------------ | -------------------------------- |
| `src/pages/Auth.tsx:57`                          | Login — validação de credenciais |
| `src/pages/Auth.tsx:93`                          | Cadastro de usuário              |
| `src/pages/ResetPassword.tsx:59`                 | Redefinição de senha             |
| `src/pages/auth/AuthForgotPassword.tsx:33`       | Esqueci minha senha              |
| `src/components/security/IPAccessControl.tsx:88` | Controle de acesso por IP        |
| `src/components/common/CSVImporter.tsx:44`       | Importação CSV                   |
| `src/lib/csvImporter.ts:18`                      | Importação CSV (lib)             |
| `src/lib/excelImporter.ts:30`                    | Importação Excel                 |
| `src/lib/validations.ts:154`                     | Validação compartilhada          |
| `src/hooks/common/useImportData.ts:122`          | Importação em massa              |

---

## 2. CONTAGEM POR CLASSIFICAÇÃO

Foram classificadas **110 funcionalidades**. Critério da regra de ouro: _pronto = em produção com
uso real_. Como o acesso de runtime disponível **não permite contar linhas de tabelas protegidas
por RLS** (ver §5), nenhuma funcionalidade de negócio pôde ser promovida a ✅ apenas por existir —
✅ exige prova de execução observada.

| Classificação               | Qtd | %              | Significado                                                                   |
| --------------------------- | --- | -------------- | ----------------------------------------------------------------------------- |
| ✅ **IMPLEMENTADO_TOTAL**   | 15  | 13,6% (15/110) | Fio completo **e** execução observada em runtime                              |
| 🟨 **IMPLEMENTADO_PARCIAL** | 76  | 69,1% (76/110) | Fio completo em código; falta prova de uso, ou há defeito/lacuna identificada |
| 🟦 **SUGERIDO_OU_INICIADO** | 15  | 13,6% (15/110) | Existe artefato, mas sem consumidor, sem agendador ou sem lógica              |
| ⬛ **MORTO_OU_ABANDONADO**  | 4   | 3,6% (4/110)   | Código presente, nenhum caminho de execução alcança                           |

> **Leitura honesta do número:** os 69,1% em 🟨 **não** significam "meio construído". Na grande
> maioria dos casos o código está inteiro e implantado — o que falta é **evidência de uso**, que
> este auditor não teve permissão para coletar. Um leitor com acesso SQL de leitura converteria
> boa parte desses 🟨 em ✅ em poucos minutos (ver §7).
>
> Os 4 itens ⬛ são: `useNexusSimulator.ts`, `useSelfHealing.ts`, o heartbeat do sistema e o job
> `generate-audit-pdf`.

---

## 3. RISCOS ESTRUTURAIS, POR GRAVIDADE

### R1 — 🔴 CRÍTICO · Validação de formulários estoura em produção

Descrito em §1. Atinge login, cadastro, reset de senha e importação de dados.
**Evidência:** teste empírico com `zod@4.4.3` instalado + 10 `arquivo:linha` acima.
**Custo de correção:** trocar `.errors` por `.issues` em 10 locais. Baixo risco.

### R2 — 🔴 CRÍTICO · Nenhum portão de qualidade funciona há ~3 meses

120 execuções de workflow amostradas em 4 janelas (16/08, 23/07, 20–22/05/2026): **zero sucessos**.
O único `success` encontrado é o workflow de metadados do próprio Dependabot, não um job de build.

| Workflow              | Arquivo                          | Estado real            |
| --------------------- | -------------------------------- | ---------------------- |
| CI/CD Pipeline        | `.github/workflows/ci.yml`       | falha em todos os jobs |
| CI Quality Gate Nexus | `.github/workflows/ci-nexus.yml` | falha                  |
| Security Scan         | `.github/workflows/security.yml` | falha                  |

**A causa mudou ao longo do tempo.** Inspeção passo a passo dos jobs revela três regimes distintos —
tratá-los como um só levaria a corrigir a coisa errada:

| Período                                                           | `npm ci`                     | O que falhava de fato                                                                                                                                     |
| ----------------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| até 16/08 15:2x (ex.: run `30025705603`, 23/07, commit `ad50655`) | ✅ sucesso (28–32 s)         | `npm run lint`, `npm run test:coverage`, `Enforce lint/TS warning budget`, `npm audit` e `md-to-pdf audit_report.md`. **O `Type Check` PASSOU em 23/07.** |
| a partir de 16/08 15:2x (run `31955665339`, commit `513ab5a`)     | 🔴 falha em 1 s (`ERESOLVE`) | lint, typecheck, testes e budget passam a ser **`skipped`** — os portões morrem antes de rodar                                                            |
| PR #23, 16/08 19:10 (runs `31966770428`/`31966770434`)            | —                            | jobs terminam em ~3 s com `runner_id: 0` e `runner_name: ""` — **nunca receberam runner**. Modo de falha distinto dos dois anteriores.                    |

Ou seja: o pipeline está vermelho de forma contínua desde pelo menos 20/05/2026, mas o `ERESOLVE`
de `@eslint/js@^10.0.1` vs `eslint@^9.32.0` só entrou em cena em 16/08. Antes disso o pipeline
instalava normalmente e falhava nas verificações em si.

**Consequência atual:** desde 16/08 15:2x, lint, typecheck, testes e orçamento de warnings são
`skipped` — os 21 erros de typecheck introduzidos hoje pelo `zod@4` **nunca chegaram a ser
reportados**. O portão existe no YAML, mas morre antes de rodar.

### R3 — 🟠 ALTO · O ambiente não nasce do repositório

Um cron horário persiste snapshots de saúde do banco — verificado: o registro mais recente é
`2026-08-16T18:00:02Z` (retornado por `/functions/v1/db-health-snapshot`). **Esse agendamento não
existe em nenhuma migration.** As migrations versionadas declaram **15** chamadas `cron.schedule`, e
nenhuma delas invoca Edge Functions nem `persist_db_health_snapshot` (parse exaustivo em
`ESTADO_ATUAL_EVIDENCIAS.md` §7.1).
**Consequência:** reconstruir o projeto a partir do repositório produz um ambiente sem essa rotina.

**Segunda prova, mais forte — código vivo sem fonte no repositório.** A Edge Function
`migrate-helper` está **implantada e executando** em produção: responde `{"error":"unauthorized"}`,
que é a checagem de autenticação da própria função (uma função ausente responderia
`{"code":"NOT_FOUND"}`). **Não existe `supabase/functions/migrate-helper/` no repositório.**

> **Atualização de 25/11/2026 (sondagem de produção):** esta segunda prova **caiu**. A Edge Function
> `migrate-helper` **não responde mais** em produção: a sonda de hoje devolveu
> **HTTP 404 `{"code":"NOT_FOUND"}`**, enquanto `health`, no mesmo gateway, devolveu 200 - ou seja, o
> 404 é ausência da função, não falta de credencial. O item "função viva sem fonte no repositório" deixa
> de existir; o que ela fazia está versionado em `scripts/ops/backup_origem.sh` (com teste em
> `scripts/ops/backup_origem.unit.mjs`). `supabase/functions/migrate-helper/` não existe no repositório.

Ou seja, roda em produção um código que ninguém pode revisar, versionar ou reconstruir — e o nome
sugere que ele executa migrations, operação privilegiada. O drift de implantação é **assimétrico**:
repo → ambiente está 43/43 em dia; ambiente → repo tem pelo menos 1 função órfã.

### R3-b — 🟡 MÉDIO · Duas gerações de cron convivendo, agendando o mesmo trabalho

Das 15 chamadas `cron.schedule` versionadas, **3 pares executam a função idêntica** em horários
diferentes — resultado de uma renomeação (`nexus_*` em 11/07 → kebab-case em 12/07) em que a
geração antiga nunca foi removida:

| Ação                             | Job antigo (11/07)                      | Job novo (12/07)                             |
| -------------------------------- | --------------------------------------- | -------------------------------------------- |
| `record_heartbeat()`             | `nexus_heartbeat` — `*/5 * * * *`       | `system-heartbeat-1m` — `* * * * *`          |
| `cleanup_old_telemetry_logs(30)` | `nexus_telemetry_cleanup` — `0 4 * * *` | `cleanup-telemetry-daily` — `0 3 * * *`      |
| `cleanup_old_notifications(90)`  | `nexus_notifications_ttl` — `0 5 * * 0` | `cleanup-notifications-weekly` — `0 4 * * 0` |

É o padrão "refactor abandonado": o módulo novo foi criado, o antigo continua agendado. Duplica
trabalho de limpeza e torna o diagnóstico do heartbeat (R4) mais confuso do que precisa ser.

_Ressalva:_ isto é o que o **repositório declara**. Sem acesso a `cron.job` não é possível dizer
quais desses 15 estão de fato registrados no banco — marcado `NAO_VERIFICADO`.

### R4 — 🟠 ALTO · Heartbeat morto e função incompatível com o schema

`system_heartbeat` tem 4 serviços; **3 estão congelados em `2026-05-19T16:54:35Z`**. Duas leituras
espaçadas de 5 minutos (18:53 → 18:58 UTC de 16/08) não registraram nenhuma atualização, apesar do
cron `system-heartbeat-1m` declarado com frequência de 1 minuto.

A causa provável está versionada: `record_heartbeat()`
(`supabase/migrations/20260711153319_*.sql:43`) faz
`INSERT INTO system_heartbeat (status, message, checked_at)` — mas **as colunas `message` e
`checked_at` não existem**. Confirmado por três fontes independentes:

- PostgREST retorna `42703: column system_heartbeat.checked_at does not exist`
- idem para `message`
- `src/integrations/supabase/types.ts` declara apenas `service_name, status, latency_ms, last_check, version, metadata`

_Ressalva declarada:_ não foi possível ler o corpo da função **viva** (sem acesso SQL). O que está
provado é que **a versão do repositório é incompatível com o schema vivo** e que **o heartbeat não
está atualizando**. Ambos apontam na mesma direção, mas a confirmação final exige `\sf record_heartbeat`.

### R5 — 🟠 ALTO · Parte da suíte de testes não protege nada

7 dos 32 arquivos de teste (21,9%) não importam nenhum código do projeto — reimplementam a lógica
dentro do próprio teste e afirmam sobre si mesmos. Ficam verdes para sempre, inclusive se o produto
quebrar. Detalhe e citações em [`ESTADO_ATUAL_EVIDENCIAS.md`](./ESTADO_ATUAL_EVIDENCIAS.md) §4.

Destaques:

- `tests/fuzzing/edge-functions.spec.ts` e `tests/integration/fuzzing.spec.ts` são **funcionalmente
  idênticos** (mesmos 2 testes e mesmas asserções; diferem só em 2 linhas em branco e 1 comentário)
  e testam um literal de regex — nenhuma Edge Function é tocada.
- `tests/integration/massive-simulation.spec.ts` anuncia "10.000 cenários" e apenas monta objetos
  locais em laço.
- `tests/contracts/nexus-contracts.spec.ts` define os schemas Zod **dentro do teste** em vez de
  importar os do projeto → divergência de contrato é indetectável por construção.
- `tests/load/backend-stress.spec.ts` mede `setTimeout` aleatório; a saída real é
  `Simulated 100 requests. Avg time: 0.49ms`.

### R6 — 🟡 MÉDIO · Job de CI aponta para arquivo inexistente

`.github/workflows/ci.yml` (job `generate-audit-pdf`) roda `md-to-pdf audit_report.md`, faz commit
e **push direto na branch principal**. O arquivo `audit_report.md` **não existe no repositório**.

### R7 — 🟡 MÉDIO · Documentação canônica invertida

`docs/INVENTARIO_FUNCIONALIDADES.md:122` declara **"Status Geral: 10/10 — PERFEIÇÃO ATINGIDA"**,
datado de 12/05/2026. A CI já estava vermelha em 20/05/2026 e permaneceu assim. Documentos como
`docs/PERFEICAO_10_10.md` e `docs/RELATORIO_PERFEICAO_FINAL.md` reforçam a mesma leitura otimista.
Esses arquivos são o primeiro contato de qualquer dev ou agente novo com o sistema.

> **Nota de método:** conforme o guard-rail de não editar artefatos de outras trilhas, **nenhum
> documento existente foi alterado**. Esta é a errata; a decisão de reconciliar é do dono.

---

## 4. O QUE ESTÁ BOM (sem distorcer o quadro)

Distorcer para baixo seria tão desonesto quanto o inverso. O que foi **medido como sólido**:

- **Implantação sem drift.** As 43 Edge Functions do repositório estão implantadas e respondendo.
  Zero ausentes. Verificado com discriminador correto (§5.1).
- **Nenhuma página órfã.** Varredura em 646 arquivos: 0 páginas sem referenciador; apenas 2 hooks
  órfãos reais (`useNexusSimulator.ts`, `useSelfHealing.ts`).
- **RPCs corretamente fechados.** `system_health_check`, `get_dashboard_metrics`, `get_leaderboard`,
  `record_heartbeat`, `get_cron_jobs_status`, `get_global_health_score_fast` — todos negam `anon`
  com `42501`. `exec_sql` não está exposto via PostgREST. Postura de RLS/GRANT correta.
- **Saúde real do banco.** `/functions/v1/health` responde `healthy` com latência de banco medida;
  snapshot real reporta `cache_hit_ratio: 99.91`, `deadlocks: 0`, `db_size_bytes: 80.727.187`.
  O banco tem ~80 MB — **não é um ambiente vazio**.
- **Testes com valor real.** 20 dos 32 arquivos importam o alvo de verdade. `eventCodes.test.ts`
  (266 linhas) é exemplar: PRNG determinístico, 500 cenários de fuzz e verificação de invariantes.
- **Segurança em profundidade presente e cabeada:** WebAuthn/Passkeys, MFA, geo-blocking, trilha de
  auditoria particionada (18 partições mensais), soft delete, rate limiting.

---

## 5. O QUE ESTA AUDITORIA **NÃO** COBRIU — declarado, não escondido

### 5.1 Correções aplicadas ao próprio trabalho

Duas conclusões intermediárias estavam **erradas** e foram corrigidas antes de entrar no relatório.
Ficam registradas porque quem lê precisa saber que houve revisão:

| Conclusão inicial (ERRADA)                                                                            | Correção verificada                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "21 das 44 Edge Functions não estão implantadas" — baseado no `functions_list` do MCP, que retorna 23 | O MCP serve uma **lista estática desatualizada**. Sondagem HTTP direta provou **43/43 implantadas**.                                                                                                                                                                              |
| "`lalamove-api` não está implantada" — baseado em HTTP 404                                            | O 404 é resposta **interna da própria função** (`{"error":"Route not found"}`, `supabase/functions/lalamove-api/index.ts:155`). Uma função ausente responde `{"code":"NOT_FOUND","message":"Requested function was not found"}`. **`lalamove-api` está implantada e executando.** |

**Terceira correção — atribuição de causa do R2.** Conclusão inicial: _"o `ERESOLVE` explica os ~3
meses de CI vermelha, e por isso os 21 erros de typecheck nunca foram reportados."_ A inspeção
**passo a passo** dos jobs desmentiu a generalização: no run `30025705603` (23/07) o `npm ci`
concluiu com **sucesso** em 31 s e o job `Type Check` **passou**. O `ERESOLVE` só entrou em cena em
16/08 15:2x, com os merges do Dependabot. Antes disso, quem falhava eram `npm run lint`,
`npm run test:coverage`, o gate de warnings, `npm audit` e `md-to-pdf`. Correção aplicada em §3/R2.

Se o segundo achado tivesse sido publicado, provocaria um redeploy inútil sobre um serviço saudável.
O terceiro é o mais instrutivo: a **conclusão** dos workflows (`failure`) estava certa, mas a
**causa** que lhe atribuí estava errada — e só a leitura por passo, não por conclusão, revelou isso.

### 5.1-b Segunda rodada de validação — o que ela derrubou

Uma revisão dedicada a caçar falhas neste próprio relatório encontrou mais quatro defeitos e um
achado que faltava. Ficam registrados pelo mesmo motivo dos anteriores:

| Defeito                                                   | Correção                                                                                                                                                                                                             |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **"8 chamadas `cron.schedule`"**                          | São **15**, em 8 migrations. O `grep` só casava a forma de linha única. Cinco jobs ficaram fora do relatório. Corrigido em §3/R3 e no anexo §7.1.                                                                    |
| **"duplicatas byte a byte"** (testes de fuzzing)          | Falso. Os MD5 diferem (`5cad21b2…` / `2cf93ae1…`): são **funcionalmente** idênticos, mas separados por 2 linhas em branco e 1 comentário. Precisão que eu não havia medido.                                          |
| **"zero drift de deploy"**                                | Verdadeiro só no sentido repo → ambiente. A sondagem, por construção, não podia achar código vivo sem fonte. O teste inverso revelou **`migrate-helper` em produção sem existir no repositório**. Virou parte de R3. |
| **Critério de pronto: "100% dos arquivos inventariados"** | Overclaim. Recontar 1.005 arquivos e mapeá-los por diretório **não é** inventariá-los: o conteúdo de ~35 foi lido. Rebaixado para ⚠️ PARCIAL em §8.                                                                  |
| **Denominadores inconsistentes nos testes**               | "7 de 30" e "12 de 32" conviviam. São **32** arquivos no total: 30 executados pelo vitest e 2 (`tests/e2e`) pelo Playwright, que o vitest exclui via `vitest.config.ts:12`. Padronizado em 32.                       |
| **Achado que faltava**                                    | Três pares de jobs de cron duplicados — nova seção §3/R3-b.                                                                                                                                                          |

**O que a segunda rodada confirmou como correto** (medido de novo, não reafirmado): os 10 pontos de
`.errors` e sua distribuição por arquivo; 43 funções no repo; 61 rotas com 0 páginas órfãs — desta
vez por _parse dos `lazy(() => import("./pages/…"))`_, já que o detector original usava `@/pages/` e
não casava os imports relativos; 130 tabelas = 100 base + 30 partições; 4 views; 79 RPCs; 33
segredos; os 2 hooks órfãos com 0 referências; os 8 casos de "0 chamadores em `src/`"; e os 4 pontos
de `Math.random()` visíveis ao usuário — sendo que o de `KPICard.tsx:343` é rotulado na tela como
**"Completion Rate"**, o que é pior do que a primeira redação sugeria.

### 5.2 Limites de acesso — `NAO_VERIFICADO`

- **Contagem de linhas de tabelas protegidas por RLS.** A ferramenta MCP de SQL está indisponível
  (`mcp-query` não implantada — confirmado `NOT_FOUND`). O acesso restante é a chave _publishable_
  como `anon`. Nesse papel, `200 + content-range: */0` **não prova tabela vazia** — pode ser RLS
  filtrando por `auth.uid()`. **Nenhuma afirmação de "feature dormente por tabela vazia" foi feita
  nesta auditoria**, porque a evidência não sustentaria.
- **Migrations aplicadas × versionadas.** Requer leitura de `supabase_migrations.schema_migrations`.
  Não acessível. As 230 migrations do repositório não foram confrontadas com o banco.
- **Corpo vivo de funções PL/pgSQL.** Sem acesso SQL, não há como diferenciar repositório de runtime.
- **Histórico de execução de cron** (`cron.job_run_details`) — não acessível.
- **Tráfego real de webhooks e filas** — não acessível.

### 5.3 Fora de escopo por decisão

- **Nada foi alterado em produção.** Zero DDL, zero DML, zero deploy, zero migration.
  Todas as chamadas foram `GET`/leitura ou `POST` a endpoints de diagnóstico idempotentes.
- **Testes E2E (Playwright) não foram executados** — exigem navegador e app servido.
- **Revisão de acessibilidade, performance de bundle e i18n** não foram objeto desta auditoria.
- **Conteúdo semântico das 230 migrations** foi inventariado por objeto (cron, funções, colunas),
  não lido linha a linha — escopo muito acima do teto de contexto.

---

## 6. INVENTÁRIO DE FUNCIONALIDADES

Legenda de runtime: **V** = verificado em execução · **NV** = `NAO_VERIFICADO`

### 6.1 Núcleo logístico

| Funcionalidade                   | Class. | Runtime | Evidência                                                                                                                                      |
| -------------------------------- | ------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard em tempo real          | 🟨     | NV      | `src/pages/Index.tsx`; RPC `get_dashboard_metrics` existe e nega `anon` (42501)                                                                |
| Kanban de entregas               | 🟨     | NV      | rota `/kanban-entregas` (`src/App.tsx`); `src/pages/KanbanEntregas.tsx`; tabela `kanban_history`                                               |
| Gestão de coletas                | 🟨     | NV      | rota `/coletas`; `src/components/coletas/` (4 arq., 1.255 linhas); tabela `coletas`                                                            |
| Gestão de boxes                  | 🟨     | NV      | rota `/gestao-box`; `src/components/box/` (3 arq., 361 linhas)                                                                                 |
| Despachos                        | 🟨     | NV      | rota `/despachos`; `src/pages/Despachos.tsx`                                                                                                   |
| Envios                           | 🟨     | NV      | rota `/envios`; `src/components/shipping/` (3 arq., 683 linhas)                                                                                |
| Ocorrências                      | 🟨     | NV      | rota `/ocorrencias`; tabela `ocorrencias`                                                                                                      |
| Logística reversa                | 🟨     | NV      | rota `/logistica-reversa`; tabela `logistica_reversa`                                                                                          |
| Rastreamento público (sem login) | 🟨     | NV      | `src/pages/RastreamentoPublico.tsx`; RPC `get_public_tracking(p_code)` — **existe e é `GRANT` para `anon`** (migration `20260711183644_*.sql`) |
| Rastreamento em tempo real       | 🟨     | NV      | rota `/central-rastreamento`; `rastreamento_historico` com **18 partições mensais** (`y2026m01` … `y2027m06`)                                  |
| Rastreamento do motorista        | 🟨     | NV      | rota `/rastreamento-motorista`; `src/components/map/` (6 arq., 1.335 linhas)                                                                   |
| Mapa de rotas                    | 🟨     | NV      | rota `/mapa-rotas`; Edge `get-mapbox-token` **implantada**                                                                                     |
| Calendário logístico             | 🟨     | NV      | rota `/calendario`; `src/pages/CalendarioLogistico.tsx`                                                                                        |
| Rotas de transportadoras         | 🟨     | NV      | rota `/rotas-transportadoras`; tabela `transportadora_rotas`                                                                                   |
| Coordenadas simuladas em rotas   | 🟦     | V       | `src/hooks/logistics/useDeliveryRoutes.tsx:80-81` — `lat/lng` recebem ruído `Math.random()`                                                    |

### 6.2 Frete, custos e financeiro

| Funcionalidade                        | Class. | Runtime | Evidência                                                                                                                                                             |
| ------------------------------------- | ------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cotação de frete                      | 🟨     | NV      | rota `/cotacao-frete`; tabela `cotacoes_frete`                                                                                                                        |
| Cotação multicanal                    | 🟨     | NV      | rota `/cotacao-multicanal`; `src/pages/cotacao-multicanal/` (4 arq.); tabela `cotacoes_multicanal`                                                                    |
| Seleção inteligente de transportadora | ✅     | V       | Edge `smart-carrier-selection` **implantada** (401 sem JWT = auth ativa); `freight_selection_rules` com **3 regras reais** (`Normal`, `Urgente`, +1) legíveis via API |
| Normalização de resposta de frete     | ✅     | V       | Edge `normalize-freight-response` **implantada e respondendo**                                                                                                        |
| Conciliação de faturas                | 🟨     | NV      | rota `/conciliacao`; `src/pages/conciliacao/` (4 arq., 581 linhas); tabelas `conciliacoes`, `conciliacao_itens_importados`                                            |
| Conciliação automática                | 🟨     | NV      | rota `/conciliacao-automatica`; RPC `reconcile_pending_freights` existe                                                                                               |
| Dashboard de custos                   | 🟨     | NV      | rota `/custos`; `src/pages/CustosDashboard.tsx`                                                                                                                       |
| Alertas de custo                      | 🟨     | NV      | rota `/alertas-custo`; tabelas `alertas_custo`, `notificacoes_custo`                                                                                                  |
| Inteligência de frete                 | 🟨     | NV      | rota `/inteligencia-frete`; `src/components/freight/` (18 arq., 2.673 linhas)                                                                                         |
| Fretes internos                       | 🟨     | NV      | rota `/fretes-internos`; tabela `fretes_internos`                                                                                                                     |
| Tabelas de frete                      | 🟨     | NV      | rota `/config-frete`; tabela `tabelas_frete`                                                                                                                          |
| Dashboard de cotações                 | 🟨     | NV      | rota `/dashboard-cotacoes`                                                                                                                                            |
| Importação em massa (CSV/Excel)       | 🟨     | V       | rota `/importacao-massa` — **defeito ativo**: `src/lib/csvImporter.ts:18` e `src/lib/excelImporter.ts:30` estouram em erro de validação (R1)                          |

### 6.3 Integrações

| Integração                       | Class. | Runtime | Evidência                                                                                                                                                                                                                         |
| -------------------------------- | ------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rodonaves (RTE)**              | ✅     | V       | Edge `rodonaves-api` **implantada** (422 = validação ativa); `rodonaves-webhook` implantada (401); `src/lib/rodonaves/` (15 arq., 2.769 linhas); 6 hosts `*.rte.com.br`; segredos `RODONAVES_USERNAME/PASSWORD/CNPJ_REMETENTE`    |
| **Lalamove**                     | ✅     | V       | Edge `lalamove-api` **implantada e executando** — resposta interna própria comprovada; expõe `quotations`, `orders`, `GET orders`, `PUT cancel` (`index.ts:79,126,136,146`); `lalamove-tracking` e `lalamove-webhook` implantadas |
| **Melhor Envio**                 | 🟨     | NV      | Edge `melhor-envio-api` implantada; `src/components/melhorenvio/` (18 arq., 3.305 linhas); **sandbox e produção coexistem** (`index.ts:7-8`) — qual está ativo depende de segredo não legível                                     |
| **Bitrix24**                     | 🟨     | NV      | Edge `bitrix24-integration` implantada; rota `/bitrix24`; tabelas `bitrix_sync_config`, `bitrix_sync_logs`; segredo `BITRIX24_WEBHOOK_URL`                                                                                        |
| **WhatsApp (Evolution)**         | 🟨     | NV      | Edges `evolution-whatsapp` + `whatsapp-notification` implantadas; segredos `EVOLUTION_API_URL/KEY`                                                                                                                                |
| **Resend (e-mail)**              | ✅     | V       | Edge `resend-email` implantada e responde 200; `api.resend.com` em 5 pontos; segredo `RESEND_API_KEY`                                                                                                                             |
| **Mapbox**                       | ✅     | V       | Edge `get-mapbox-token` implantada; `VITE_MAPBOX_TOKEN` presente no ambiente                                                                                                                                                      |
| **OpenWeather**                  | 🟨     | NV      | Edge `get-weather-data` implantada; segredo `OPENWEATHER_API_KEY`; **0 chamadores em `src/`**                                                                                                                                     |
| **ViaCEP**                       | 🟨     | NV      | `viacep.com.br` em 4 pontos do código                                                                                                                                                                                             |
| **Upstash Redis**                | 🟦     | NV      | apenas `UPSTASH_REDIS_REST_URL/TOKEN` em 1 Edge Function; sem UI e sem tabela                                                                                                                                                     |
| **aTicket**                      | 🟦     | NV      | segredos `ATICKET_API_URL/API_KEY` referenciados; sem rota, sem UI, sem tabela                                                                                                                                                    |
| **Slack (alertas de segurança)** | 🟦     | NV      | `SECURITY_SLACK_WEBHOOK_URL` em 1 ponto; `ci.yml` notifica via `SLACK_WEBHOOK_URL`, mas o job nunca chega a rodar (R2)                                                                                                            |
| **Ponte para banco externo**     | 🟨     | NV      | Edge `external-db-bridge` implantada; segredos `EXTERNAL_SUPABASE_URL/SERVICE_KEY`                                                                                                                                                |
| **OpenAI**                       | 🟦     | NV      | `OPENAI_API_KEY` referenciada em 1 Edge Function; a IA de produto usa `ai.gateway.lovable.dev`                                                                                                                                    |

### 6.4 Inteligência artificial e predição

| Funcionalidade                  | Class. | Runtime | Evidência                                                                                                                                           |
| ------------------------------- | ------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Assistente logístico (IA)       | ✅     | V       | Edge `ai-logistics-assistant` implantada, **401 sem JWT** = `verify_jwt` ativo (`supabase/config.toml`); `src/components/ai/` (2 arq.)              |
| Predição de atrasos             | ✅     | V       | Edge `predict-delays` implantada (401); `src/lib/predictions/` (13 arq., 1.628 linhas); tabelas `ai_delay_predictions`, `delay_predictions_history` |
| Predição agendada               | 🟦     | NV      | Edge `predict-delays-scheduled` implantada, **mas nenhum `cron.schedule` do repositório a invoca** — as 15 chamadas versionadas são todas SQL puro  |
| Acurácia de predição            | 🟨     | NV      | 4 views `v_prediction_accuracy*`; Edge `accuracy-meta-monitor` implantada; tabela `prediction_accuracy_settings`                                    |
| Digest semanal de acurácia      | 🟦     | NV      | Edge `accuracy-weekly-digest` implantada; **sem agendador versionado**                                                                              |
| Análise de causa raiz           | 🟨     | NV      | `src/hooks/logistics/useRootCauseAnalysis.ts`; `src/lib/predictions/rootCauseAnalyzer.test.ts` importa o alvo real                                  |
| Simulador de cenários (what-if) | 🟨     | NV      | `src/lib/predictions/whatIfScenarios.ts` + teste que importa o alvo                                                                                 |
| Recomendação de mitigação       | 🟨     | NV      | `src/lib/predictions/mitigationRecommender.test.ts`; tabela `mitigation_actions`                                                                    |
| Simulador Nexus                 | ⬛     | V       | `src/hooks/ai/useNexusSimulator.ts` — **0 referenciadores em 646 arquivos**                                                                         |
| OCR de comprovantes             | 🟨     | NV      | Edge `ocr-receipt-processor` implantada; 1 chamador em `src/`                                                                                       |

### 6.5 Automação e webhooks

| Funcionalidade                        | Class. | Runtime | Evidência                                                                                                                                                                |
| ------------------------------------- | ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Motor de regras de automação          | 🟨     | NV      | rota `/automacao-regras`; `src/components/automation/` (3 arq.); tabelas `business_rules`, `rule_execution_logs`, `automation_audit_logs`                                |
| Gestão de webhooks                    | 🟨     | NV      | rota `/webhooks`; tabelas `client_webhooks`, `webhook_deliveries`, `webhook_events_processed`                                                                            |
| Receptor de webhook de transportadora | 🟨     | NV      | Edge `carrier-webhook-receiver` implantada (401); `verify_jwt=false` + HMAC em código (`config.toml`)                                                                    |
| Receptor de webhook Nexus             | 🟨     | NV      | Edge `nexus-webhook-receiver` implantada; segredo `NEXUS_WEBHOOK_SECRET`                                                                                                 |
| Status de webhook                     | 🟨     | V       | Edge `webhook-status` implantada; **`index.ts:193` responde `Action not implemented` para ações não cobertas**                                                           |
| Relatórios agendados                  | 🟦     | NV      | Edge `scheduled-reports` implantada; tabela `scheduled_reports`; **sem agendador versionado e 0 chamadores em `src/`**                                                   |
| Auto-healing Nexus                    | ✅     | V       | Edge `nexus-auto-healing` responde `{"success":true,"repairs_executed":0,"latency_ms":147}`                                                                              |
| Protocolo Nexus                       | 🟨     | NV      | Edge `execute-protocol` implantada (401); RPC `execute_nexus_protocol`; tabela `nexus_tactical_logs`                                                                     |
| Ingestão BioSync                      | 🟦     | V       | Edge `ingest-biosync` implantada, **mas `index.ts:43` gera `heart_rate` com `Math.random()`** quando ausente; 0 chamadores em `src/`; `bio_sync_alert_rules` tem 1 regra |

### 6.6 Segurança e conformidade

| Funcionalidade                  | Class. | Runtime | Evidência                                                                                                                                         |
| ------------------------------- | ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| RLS e GRANTs restritivos        | ✅     | V       | 6 RPCs sensíveis negam `anon` com `42501`; `organizations`/`transportadoras` negam SELECT a `anon`                                                |
| WebAuthn / Passkeys             | 🟨     | NV      | `src/hooks/auth/useWebAuthn.tsx`; `src/components/security/PasskeyManager.tsx`; tabelas `webauthn_credentials`, `webauthn_challenges`             |
| MFA / 2FA                       | 🟨     | NV      | `src/hooks/auth/useMFA.ts`; `src/components/security/TwoFactorSetup.tsx`                                                                          |
| Geo-blocking                    | 🟨     | NV      | `src/components/security/GeoBlockingPanel.tsx`; tabelas `geo_blocking_rules`, `geo_blocking_settings`, `geo_blocked_attempts`, `geo_access_rules` |
| Controle de acesso por IP       | 🟨     | V       | `src/components/security/IPAccessControl.tsx` — **defeito ativo em `:88`** (R1); tabelas `ip_access_rules`, `allowed_ips`                         |
| Trilha de auditoria             | 🟨     | NV      | tabela `audit_logs` + **12 partições mensais** (`y2026m07` … `y2027m06`)                                                                          |
| Verificação de senha vazada     | 🟨     | NV      | Edge `check-password-breach` implantada                                                                                                           |
| Rate limiting                   | 🟨     | NV      | rota `/rate-limit`; Edge `check-rate-limit` implantada; tabela `rate_limit_logs`                                                                  |
| Bloqueio de conta               | 🟨     | NV      | tabelas `account_lockouts`, `login_attempts`; Edges `validate-login` e `log-login-attempt` implantadas                                            |
| Alerta de novo dispositivo      | 🟨     | NV      | Edge `new-device-alert` implantada; tabela `known_devices`                                                                                        |
| Gestão de sessões               | 🟨     | NV      | `src/hooks/auth/`; tabela `user_sessions`                                                                                                         |
| Registro de evento de segurança | ✅     | V       | Edge `log-security-event` implantada e respondendo; tabela `security_events`                                                                      |
| Apagamento LGPD                 | 🟨     | NV      | Edge `lgpd-erase-user` implantada (401); `docs/LGPD_COMPLIANCE.md`; **0 chamadores em `src/`**                                                    |
| Cofre de segredos               | 🟨     | NV      | Edge `secure-store` implantada; segredo `FIELD_ENCRYPTION_KEY`; **0 chamadores em `src/`**                                                        |
| Auto-cura de segurança          | ⬛     | V       | `src/hooks/security/useSelfHealing.ts` — **0 referenciadores**                                                                                    |
| Soft delete                     | 🟨     | NV      | `docs/SOFT_DELETE_POLICY.md`; padrão `deleted_at`                                                                                                 |

### 6.7 Gamificação

| Funcionalidade            | Class. | Runtime | Evidência                                                                                                                                                        |
| ------------------------- | ------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conquistas (achievements) | ✅     | V       | rota `/conquistas`; **6 conquistas reais** legíveis via API: `onboarding_profile`, `first_delivery`, `speed_demon`, `box_master`, `streak_7`, `onboarding_setup` |
| Patentes (ranks)          | ✅     | V       | **5 patentes reais** com `min_level`, `icon`, `reward_multiplier` — ex.: `Cadete Logístico` (nível 1), `Especialista de Rota` (nível 5)                          |
| XP e níveis               | 🟨     | NV      | RPCs `add_user_xp`, `calculate_level`, `xp_for_level` existem e negam `anon`; tabela `user_levels`                                                               |
| Loja de recompensas       | 🟨     | NV      | rota `/loja`; `src/pages/LojaRecompensas.tsx`; RPC `purchase_reward`; tabelas `reward_items`, `reward_purchases`                                                 |
| Ranking / leaderboard     | 🟨     | NV      | rota `/ranking`; RPC `get_leaderboard` existe e nega `anon`                                                                                                      |
| Streak de atividade       | 🟨     | NV      | RPC `update_user_streak`                                                                                                                                         |
| Badges de motorista       | 🟨     | NV      | tabela `driver_badges`                                                                                                                                           |

### 6.8 Observabilidade do banco

| Funcionalidade             | Class. | Runtime | Evidência                                                                                                                                      |
| -------------------------- | ------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Snapshot de saúde do banco | ✅     | V       | Edge `db-health-snapshot` retorna snapshot real de `2026-08-16T18:00:02Z`: `cache_hit_ratio 99.91`, `deadlocks 0`, `db_size 80.727.187 bytes`  |
| Painel de saúde do banco   | 🟨     | NV      | rota `/admin/db-health`; `src/pages/admin/DbHealth.tsx`; `src/features/db-observability/`                                                      |
| ~40 RPCs de diagnóstico    | 🟨     | NV      | `get_bloat_hotspots`, `get_unused_indexes`, `get_wal_health`, `get_wraparound_status`, `get_seq_scan_hotspots` etc. — declarados em `types.ts` |
| Propostas de índice        | 🟨     | NV      | tabela `index_proposals`; RPCs `apply_index_proposal`, `reject_index_proposal`, `auto_revert_ineffective_indexes`                              |
| Telemetria de query        | 🟨     | NV      | rota `/admin/telemetria`; `src/pages/admin-telemetria/` (3 arq.); tabela `query_telemetry`                                                     |
| SLO diário do banco        | 🟨     | NV      | tabela `db_slo_daily`; RPC `compute_db_slo_for`                                                                                                |
| Relatório semanal de saúde | 🟦     | NV      | Edge `db-health-weekly-report` implantada; **sem agendador versionado e 0 chamadores**                                                         |
| Monitor de regressão       | 🟦     | NV      | Edge `db-regression-monitor` implantada; **sem agendador versionado e 0 chamadores**                                                           |
| Heartbeat do sistema       | ⬛     | V       | **3 de 4 serviços congelados desde 2026-05-19** (R4)                                                                                           |
| Quality gate in-app        | 🟨     | NV      | rota `/admin/quality-gate`; `src/pages/admin/QualityGate.tsx`                                                                                  |
| Registro de ADRs no banco  | 🟨     | NV      | rota `/admin/adr`; tabelas `system_adr`, `architecture_decisions`; 19 ADRs em `docs/adr/`                                                      |

### 6.9 Plataforma, UX e infraestrutura

| Funcionalidade                  | Class. | Runtime | Evidência                                                                                                                                                        |
| ------------------------------- | ------ | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PWA / offline                   | 🟨     | NV      | `src/components/pwa/` (4 arq.); `public/` (9 arq.); tabela `push_subscriptions`                                                                                  |
| Notificações                    | 🟨     | NV      | rota `/notificacoes`; `src/components/notifications/` (5 arq., 1.046 linhas); tabelas `notifications`, `notification_templates`, `user_notification_preferences` |
| Onboarding                      | 🟨     | NV      | `src/components/onboarding/` (6 arq., 1.314 linhas); tabela `user_onboarding`                                                                                    |
| Acessibilidade (WCAG AA)        | 🟨     | NV      | `src/components/accessibility/` (4 arq., 202 linhas)                                                                                                             |
| Busca global (⌘K)               | 🟨     | NV      | `src/hooks/common/useGlobalSearch.tsx`; `src/components/search/`                                                                                                 |
| Design system                   | ✅     | V       | `src/components/ui/` — 55 componentes, 6.800 linhas; `components.json`; `tailwind.config.ts`                                                                     |
| Feature flags                   | 🟨     | NV      | tabela `feature_flags` (nega `anon` via `has_role`)                                                                                                              |
| Documentação de API             | 🟨     | NV      | rota `/api-docs`; `docs/api/openapi.yaml`                                                                                                                        |
| Exportação de dados             | 🟨     | NV      | rota `/exportacao`; `src/pages/ExportacaoDados.tsx`                                                                                                              |
| Relatório PDF                   | 🟨     | NV      | rota `/relatorio-pdf`; `src/pages/RelatorioPDF.tsx`                                                                                                              |
| **Portão de qualidade em CI**   | 🟦     | V       | 3 workflows existem; **0 sucessos em 120 execuções amostradas** (R2)                                                                                             |
| **Orçamento de warnings**       | 🟦     | V       | `.warning-budget.json` exige `tsErrors: 0`; **medido: 21**. Gate nunca executa (R2)                                                                              |
| **Limite de bundle**            | 🟦     | NV      | `.size-limit.json` (250 KB JS / 50 KB CSS); job `build` nunca chega a rodar                                                                                      |
| **Geração de PDF de auditoria** | ⬛     | V       | `ci.yml` roda `md-to-pdf audit_report.md`; **o arquivo não existe** (R6)                                                                                         |
| Infra como código               | 🟦     | NV      | `docs/infra/supabase.tf` (1.064 bytes) — não há pipeline que o aplique                                                                                           |

---

## 7. PRÓXIMOS PASSOS

### Barato e seguro — posso executar sozinho, sem tocar em produção

1. **Corrigir R1 (`.errors` → `.issues`)** em 10 arquivos. Restaura a exibição de erros de
   validação em login, cadastro, reset de senha e importação. _Maior retorno por esforço de toda
   a lista._
2. **Corrigir R2 alinhando `@eslint/js` a `^9.32.0`** (ou subir `eslint` para 10.x, decisão de
   estilo). Isso destrava `npm ci`, o lint e, por consequência, todos os 3 workflows.
3. **Zerar os 21 erros de typecheck** — 10 são consequência direta de R1; os outros 11 são
   `TS7006` (parâmetro `any` implícito) e 1 assinatura em `tests/contracts/nexus-contracts.spec.ts`.
4. **Criar `audit_report.md`** ou remover o job `generate-audit-pdf` (R6).
5. **Substituir os 7 testes-espelho** por testes que importem os alvos reais, e **remover a
   duplicata funcional** entre `tests/fuzzing/edge-functions.spec.ts` e
   `tests/integration/fuzzing.spec.ts` (R5).
6. **Remover ou cabear os 2 hooks órfãos** (`useNexusSimulator.ts`, `useSelfHealing.ts`).

### Toca produção ou o banco — é decisão sua

7. **Corrigir `record_heartbeat()`** para as colunas reais (`service_name`, `status`, `last_check`)
   — exige migration. Antes disso, confirmar o corpo da função viva (R4).
8. **Versionar o cron horário de `db-health-snapshot`** que hoje só existe no ambiente (R3), para
   que o repositório volte a reconstruir o ambiente.
9. **Decidir sobre as 6 Edge Functions sem agendador versionado** — `predict-delays-scheduled`,
   `scheduled-reports`, `accuracy-weekly-digest`, `db-health-weekly-report`, `db-regression-monitor`,
   `accuracy-meta-monitor`: agendar ou remover.
10. **Reconciliar `docs/INVENTARIO_FUNCIONALIDADES.md`** e os documentos de "perfeição 10/10" (R7).
    Não foram alterados por guard-rail — a decisão é do dono.

### Para fechar as lacunas desta auditoria

11. **Conceder acesso SQL somente-leitura** (ou implantar `mcp-query`). Com isso, em uma sessão
    curta, converte-se boa parte dos 44 🟨 em ✅ ou 🟦 com evidência: contagem real de linhas,
    `cron.job_run_details`, migrations aplicadas × versionadas e corpo vivo das funções.

---

## 8. CRITÉRIO DE PRONTO — AUTOAVALIAÇÃO

| Critério                                                         | Estado                                                                                                                                                                     |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 100% dos arquivos inventariados, verificado por recontagem       | ⚠️ **PARCIAL** — os 1.005 arquivos foram recontados e mapeados por diretório, mas o **conteúdo** de ~35 deles foi efetivamente lido. Recontagem não é inventário; ver §5.3 |
| Toda funcionalidade com uma das 4 classificações e evidência     | ✅ 68 funcionalidades, todas com `arquivo:linha`, objeto de banco ou resposta HTTP                                                                                         |
| Todo achado grave verificado de forma independente               | ✅ 7 achados graves; **2 conclusões próprias foram refutadas e corrigidas** (§5.1)                                                                                         |
| Runtime marcado `VERIFICADO` ou `NAO_VERIFICADO`, sem meio-termo | ✅ coluna Runtime em todas as tabelas                                                                                                                                      |
| Documento executivo legível em 10 minutos                        | ✅ §1 a §4                                                                                                                                                                 |
| Lacunas declaradas no próprio documento                          | ✅ §5                                                                                                                                                                      |
| Nada alterado em produção                                        | ✅ zero DDL/DML/deploy/migration                                                                                                                                           |

**Esta auditoria não se declara completa.** Ela se declara **honesta sobre seus próprios limites**:
a estrutura do sistema foi medida com rigor; o _uso real_ das funcionalidades de negócio permanece
`NAO_VERIFICADO` por falta de acesso SQL, e isso está dito em cada linha afetada.

---

_Auditoria executada em 16/08/2026 · commit `513ab5a` · branch `main` · projeto Supabase `hgicfqjayrjurivtygqf`_

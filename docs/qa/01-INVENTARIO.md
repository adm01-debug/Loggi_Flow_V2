# 01 — INVENTÁRIO DO SISTEMA E REGISTRO DE COBERTURA

> Auditoria de QA somente-leitura · repositório `adm01-debug/Loggi_Flow_V2` · `main` em `d37ba30`
> Data: 2026-11-22 · Sessão: nenhum arquivo de código, migration, banco ou serviço foi alterado.
>
> **Como ler este arquivo.** A primeira metade é o mapa do sistema (o que existe). A segunda é o
> **registro de cobertura**: cada item termina com `revisado` ou `não revisado + motivo`. A auditoria só
> pode se dizer exaustiva na medida em que esse registro mostra o que ficou de fora.

---

## 0. Suposições declaradas

O pedido veio com o bloco `<contexto>` vazio. O que segue foi **deduzido do código** e é a base de leitura
de todos os achados. Se alguma suposição estiver errada, os achados que dependem dela precisam ser relidos.

| #   | Suposição                                                                                                                                                                                                                       | De onde foi deduzida                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | É um sistema interno de **logística de uma operação que despacha mercadoria**: coleta no fornecedor, conferência na expedição, cotação de frete, despacho, rastreio até a entrega.                                              | Enums `coleta_status` / `entrega_status` (`docs/contexto/codigo/banco.json`), páginas `Coletas`, `Despachos`, `Envios`, `KanbanEntregas` |
| S2  | **Dois papéis apenas**: `admin` e `user`. Não há multi-tenant (nenhuma coluna `org_id`/`tenant_id` no schema). Todo `user` autenticado vê a operação inteira.                                                                   | `CREATE TYPE public.app_role AS ENUM ('admin','user')`, presente em 50 migrations                                                        |
| S3  | O usuário final é **funcionário da própria empresa**, não cliente externo. A única superfície pública é o rastreio por código (`/rastrear`).                                                                                    | 57 de 61 rotas sob `ProtectedRoute`; `src/pages/RastreamentoPublico.tsx`                                                                 |
| S4  | A operação depende de **terceiros reais** para funcionar: Lalamove e Rodonaves (transporte), Melhor Envio (cotação), Evolution/WhatsApp (aviso ao cliente), Mapbox (mapa), Bitrix24 (CRM). Se um cai, um fluxo de negócio para. | 46 edge functions em `supabase/functions/`, `docs/agentes/integracoes.md`                                                                |
| S5  | **Não existe staging.** Merge em `main` publica em produção pelo Vercel; o banco é um só.                                                                                                                                       | `AGENTS.md` ("Não há staging"), `vercel.json`, `docs/agentes/deploy.md`                                                                  |
| S6  | O sistema é mantido **exclusivamente por agentes de IA**, com o dono decidindo negócio. Logo, documentação divergente do código não é só ruído: é instrução errada para o próximo executor.                                     | `AGENTS.md`, `.agents/`, `.claude/`, `.codex/`, 7 planos `docs/PLANO_*.md`                                                               |

---

## 1. Stack e como isso roda

| Camada       | O que é                                                                                                                                | Evidência                                  |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Front        | Vite 5 + React 18 + TypeScript, Tailwind + shadcn/ui, TanStack Query, React Router, PWA, Sentry                                        | `package.json`, `vite.config.ts`           |
| Backend      | Supabase Cloud, projeto **`jvfhclubfpxrtrrazrgr`** — Postgres 17 + Auth + Storage + Edge Functions (Deno)                              | `supabase/config.toml:1`                   |
| Edge         | **46 funções** em `supabase/functions/` (45 funções + `_shared`)                                                                       | `ls supabase/functions`                    |
| Banco        | **248 migrations** no repo (histórico, não estado); 3 extensões declaradas: `pg_cron`, `pg_net`, `pg_trgm`                             | `docs/contexto/codigo/banco.json`          |
| Deploy front | Vercel, projeto `loggi-flow-v2` (team `juca1`) — **merge em `main` = produção**                                                        | `AGENTS.md`, `vercel.json`                 |
| Deploy edge  | **Manual**, via `workflow_dispatch` do `deploy-functions.yml`                                                                          | `.github/workflows/deploy-functions.yml`   |
| CI           | 17 workflows; 9 checks obrigatórios, `strict=false`, sem revisor obrigatório                                                           | `.github/workflows/`, `AGENTS.md`          |
| Gerenciador  | **npm** (`npm ci`, `package-lock.json`, Node 20 na CI / 24.x no Vercel). `bun.lock` e `bun.lockb` existem e **nenhum workflow os usa** | `package.json`, `.github/workflows/ci.yml` |
| Testes       | Vitest (unit/integration/security) + Playwright (`tests/e2e/`, manual)                                                                 | `vitest.config.ts`, `playwright.config.ts` |

**Build e gates (medidos nesta sessão, com `node_modules` instalado via `npm ci`):**

```
npx tsc --noEmit          → exit 0, 0 erros          [EXECUTADO]
```

> Armadilha de ambiente, registrada para o executor: num clone **sem** `npm ci`, `npx tsc --noEmit`
> devolve **19.705 erros** `TS2307: Cannot find module` — artefato de dependência ausente, não defeito do
> código. Quem for executar o plano precisa rodar `npm ci` antes de qualquer gate, ou vai perseguir 19 mil
> erros fantasma. Os demais números medidos estão em `03-ACHADOS.md`.

## 2. Ambientes

| Ambiente | Existe?             | Observação                                                                 |
| -------- | ------------------- | -------------------------------------------------------------------------- |
| Produção | Sim                 | `https://loggi-flow-v2.vercel.app` + Supabase `jvfhclubfpxrtrrazrgr`       |
| Preview  | Sim (Vercel por PR) | Aponta para o **mesmo** Supabase de produção — não há banco de preview     |
| Staging  | **Não**             | Declarado em `AGENTS.md`. Toda migration vai direto a produção             |
| Local    | Parcial             | `supabase/config.toml` existe, mas o fluxo documentado não usa stack local |

**Consequência de auditoria:** nenhum cenário de escrita pôde ser executado. Tudo que grava dado está
marcado `RASTREADO` em `02-CENARIOS.md`, nunca `EXECUTADO`.

## 3. Estrutura de pastas (pontos de entrada)

```
index.html              → ponto de entrada + CSP inline (validada por scripts/validate-csp.mjs)
src/main.tsx            → bootstrap React
src/App.tsx             → ÚNICO lugar onde rota é registrada (61 rotas)
src/pages/              → 61 telas de topo + 17 subcomponentes em subpastas
src/components/         → 381 componentes (inclui components/ui = shadcn)
src/features/           → módulos por domínio
src/hooks/              → hooks por domínio (auth/, sla/, ...)
src/services/           → clients e chamadas
src/integrations/supabase/  → client.ts + types.ts (gerado)
supabase/functions/     → 45 edge functions + _shared (auth.ts, cors.ts)
supabase/migrations/    → 248 migrations
.github/workflows/      → 17 workflows
scripts/                → automação (cada subpasta com README)
tests/                  → unit, integration, security, e2e
```

## 4. Atores e papéis

| Ator                           | Como entra                                   | O que alcança                                                                                                                                       | Evidência                                                      |
| ------------------------------ | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Visitante** (sem login)      | —                                            | `/auth`, `/reset-password`, `/rastrear`, `/*` (NotFound)                                                                                            | 4 rotas sem `ProtectedRoute`                                   |
| **`user`** (autenticado)       | e-mail/senha; WebAuthn disponível            | **49 rotas** — toda a operação: coletas, entregas, despachos, cotação, clientes, fornecedores, transportadoras, financeiro, relatórios, gamificação | `src/App.tsx`, `ProtectedRoute` sem `requiredRole`             |
| **`admin`**                    | mesmo login + papel em `user_roles`          | as 49 + **12 rotas administrativas**                                                                                                                | `ProtectedRoute requiredRole="admin"` em `src/App.tsx:164-175` |
| **pg_cron / chamador interno** | `x-internal-secret` ou Bearer `service_role` | `predict-delays-scheduled`, `resend-email`                                                                                                          | `supabase/config.toml`                                         |
| **Transportadora / terceiro**  | HMAC no webhook                              | `lalamove-webhook`, `rodonaves-webhook`, `carrier-webhook-receiver`, `nexus-webhook-receiver`                                                       | `supabase/config.toml` (`verify_jwt = false`)                  |

**Fato de arquitetura que vale para toda a auditoria:** com `app_role` = `{admin, user}` e sem coluna de
tenant, a separação é **operação inteira vs. administração**. Não existe "o vendedor X vê só os clientes
dele". Qualquer achado do tipo "usuário vê dado de outro" precisa ser lido sob essa régua: o risco real é
`user` alcançar função de `admin`, ou visitante alcançar dado de `user`.

## 5. Jornadas principais (e onde cada uma vive)

| #   | Jornada                          | Do primeiro clique ao dado gravado                                                                                                                           |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| J1  | **Entrar no sistema**            | `/auth` → `useAuth` → Supabase Auth → `user_roles` → redirect `/`                                                                                            |
| J2  | **Criar e acompanhar coleta**    | `/coletas` → form → `coletas` (status `aguardando_liberacao` → … → `finalizada`), nº gerado por `generate_coleta_numero`                                     |
| J3  | **Conferir na expedição**        | `/coletas` → `chegou_expedicao` → `conferencia_ok` ou `divergencia`                                                                                          |
| J4  | **Cotar frete**                  | `/cotacao-frete`, `/cotacao-multicanal` → edges `melhor-envio-api`, `rodonaves-api`, `lalamove-api`, `smart-carrier-selection`, `normalize-freight-response` |
| J5  | **Despachar entrega**            | `/despachos`, `/envios` → `entregas` (`aguardando_producao` → … → `finalizado`), nº por `generate_entrega_numero`                                            |
| J6  | **Rastrear**                     | `/rastreamento-realtime`, `/central-rastreamento`, `/rastrear` (público) ← webhooks das transportadoras                                                      |
| J7  | **Tratar ocorrência**            | `/ocorrencias` → `ocorrencias` → status `ocorrencia` na entrega                                                                                              |
| J8  | **Avisar o cliente**             | `evolution-whatsapp` / `whatsapp-notification` / `resend-email` / `push-send`                                                                                |
| J9  | **Cadastros**                    | `/clientes`, `/fornecedores`, `/transportadoras`                                                                                                             |
| J10 | **Financeiro / custos**          | `/conciliacao-financeira`, `/conciliacao-automatica`, `/custos-dashboard`, `/alertas-custo`                                                                  |
| J11 | **Relatórios e export**          | `/relatorios`, `/relatorio-pdf`, `/exportacao-dados`, `scheduled-reports`                                                                                    |
| J12 | **Gamificação**                  | `/ranking`, `/conquistas`, `/loja-recompensas` → `add_user_xp`, `calculate_level`                                                                            |
| J13 | **Administração**                | 12 rotas admin: usuários, segurança, auditoria, webhooks, telemetria, saúde do banco                                                                         |
| J14 | **Reset de senha com aprovação** | `/reset-password` → `send-password-reset` → `/aprovacao-reset-senha` (admin aprova)                                                                          |
| J15 | **Predição de atraso**           | `predict-delays` + `predict-delays-scheduled` (pg_cron) → `ai_delay_predictions` → `v_prediction_accuracy`                                                   |

## 6. Inventário: rotas (61) — todas registradas em `src/App.tsx`

Acesso lido da prop real em `src/App.tsx` (`requiredRole="admin"`), não do wrapper.

| Rota                      | Componente            | Arquivo (src/pages/)      | Acesso      | Carga |
| ------------------------- | --------------------- | ------------------------- | ----------- | ----- |
| `/`                       | Index                 | Index.tsx                 | auth        | lazy  |
| `/*`                      | NotFound              | NotFound.tsx              | **pública** | lazy  |
| `/admin/adr`              | AdminADR              | AdminADR.tsx              | **admin**   | lazy  |
| `/admin/db-health`        | AdminDbHealth         | admin/DbHealth.tsx        | **admin**   | lazy  |
| `/admin/quality-gate`     | AdminQualityGate      | admin/QualityGate.tsx     | **admin**   | lazy  |
| `/admin/telemetria`       | AdminTelemetria       | AdminTelemetria.tsx       | **admin**   | lazy  |
| `/alertas-custo`          | AlertasCusto          | AlertasCusto.tsx          | auth        | lazy  |
| `/analytics`              | Analytics             | Analytics.tsx             | auth        | lazy  |
| `/api-docs`               | APIDocumentation      | APIDocumentation.tsx      | **admin**   | lazy  |
| `/aprovacao-reset-senha`  | AprovacaoResetSenha   | AprovacaoResetSenha.tsx   | **admin**   | lazy  |
| `/audit-trail`            | AuditTrail            | AuditTrail.tsx            | **admin**   | lazy  |
| `/auth`                   | Auth                  | Auth.tsx                  | **pública** | lazy  |
| `/automacao-regras`       | AutomacaoRegras       | AutomacaoRegras.tsx       | auth        | lazy  |
| `/bitrix24`               | IntegracaoBitrix      | IntegracaoBitrix.tsx      | **admin**   | lazy  |
| `/calendario`             | CalendarioLogistico   | CalendarioLogistico.tsx   | auth        | lazy  |
| `/central-rastreamento`   | CentralRastreamento   | CentralRastreamento.tsx   | auth        | lazy  |
| `/clientes`               | Clientes              | Clientes.tsx              | auth        | lazy  |
| `/coletas`                | Coletas               | Coletas.tsx               | auth        | lazy  |
| `/conciliacao`            | ConciliacaoFinanceira | ConciliacaoFinanceira.tsx | auth        | lazy  |
| `/conciliacao-automatica` | ConciliacaoAutomatica | ConciliacaoAutomatica.tsx | auth        | lazy  |
| `/config-frete`           | ConfiguracoesFrete    | ConfiguracoesFrete.tsx    | auth        | lazy  |
| `/configuracoes`          | Configuracoes         | Configuracoes.tsx         | auth        | lazy  |
| `/conquistas`             | Conquistas            | Conquistas.tsx            | auth        | lazy  |
| `/cotacao-frete`          | CotacaoFrete          | CotacaoFrete.tsx          | auth        | lazy  |
| `/cotacao-multicanal`     | CotacaoMultiCanal     | CotacaoMultiCanal.tsx     | auth        | lazy  |
| `/custos`                 | CustosDashboard       | CustosDashboard.tsx       | auth        | lazy  |
| `/dashboard-cotacoes`     | DashboardCotacoes     | DashboardCotacoes.tsx     | auth        | lazy  |
| `/dashboard-executivo`    | DashboardExecutivo    | DashboardExecutivo.tsx    | auth        | lazy  |
| `/despachos`              | Despachos             | Despachos.tsx             | auth        | lazy  |
| `/envios`                 | Envios                | Envios.tsx                | auth        | lazy  |
| `/exportacao`             | ExportacaoDados       | ExportacaoDados.tsx       | auth        | lazy  |
| `/fornecedores`           | Fornecedores          | Fornecedores.tsx          | auth        | lazy  |
| `/fretes-internos`        | FretesInternos        | FretesInternos.tsx        | auth        | lazy  |
| `/gerenciamento-usuarios` | GerenciamentoUsuarios | GerenciamentoUsuarios.tsx | **admin**   | lazy  |
| `/gestao-box`             | GestaoBox             | GestaoBox.tsx             | auth        | lazy  |
| `/gestao-rodonaves`       | GestaoRodonaves       | GestaoRodonaves.tsx       | auth        | lazy  |
| `/importacao-massa`       | ImportacaoMassa       | ImportacaoMassa.tsx       | auth        | lazy  |
| `/inteligencia-frete`     | InteligenciaFrete     | InteligenciaFrete.tsx     | auth        | lazy  |
| `/kanban-entregas`        | KanbanEntregas        | KanbanEntregas.tsx        | auth        | lazy  |
| `/logistica-reversa`      | LogisticaReversa      | LogisticaReversa.tsx      | auth        | lazy  |
| `/loja`                   | LojaRecompensas       | LojaRecompensas.tsx       | auth        | lazy  |
| `/mapa-rotas`             | MapaRotas             | MapaRotas.tsx             | auth        | lazy  |
| `/melhor-envio`           | GestaoMelhorEnvio     | GestaoMelhorEnvio.tsx     | auth        | lazy  |
| `/notificacoes`           | Notificacoes          | Notificacoes.tsx          | auth        | lazy  |
| `/ocorrencias`            | Ocorrencias           | Ocorrencias.tsx           | auth        | lazy  |
| `/painel-otif`            | PainelOTIF            | PainelOTIF.tsx            | auth        | lazy  |
| `/painel-sla`             | PainelSLA             | PainelSLA.tsx             | auth        | lazy  |
| `/perfil`                 | Profile               | Profile.tsx               | auth        | lazy  |
| `/ranking`                | Ranking               | Ranking.tsx               | auth        | lazy  |
| `/rastreamento-motorista` | RastreamentoMotorista | RastreamentoMotorista.tsx | auth        | lazy  |
| `/rastreamento/:id`       | RastreamentoRealTime  | RastreamentoRealTime.tsx  | auth        | lazy  |
| `/rastrear`               | RastreamentoPublico   | RastreamentoPublico.tsx   | **pública** | lazy  |
| `/rate-limit`             | RateLimitDashboard    | RateLimitDashboard.tsx    | **admin**   | lazy  |
| `/relatorio-pdf`          | RelatorioPDF          | RelatorioPDF.tsx          | auth        | lazy  |
| `/relatorios`             | Relatorios            | Relatorios.tsx            | auth        | lazy  |
| `/reset-password`         | ResetPassword         | ResetPassword.tsx         | **pública** | lazy  |
| `/rotas-transportadoras`  | RotasTransportadoras  | RotasTransportadoras.tsx  | auth        | lazy  |
| `/seguranca`              | Seguranca             | Seguranca.tsx             | **admin**   | lazy  |
| `/sla-dashboard`          | SLADashboard          | SLADashboard.tsx          | auth        | lazy  |
| `/transportadoras`        | Transportadoras       | Transportadoras.tsx       | auth        | lazy  |
| `/webhooks`               | GestaoWebhooks        | GestaoWebhooks.tsx        | **admin**   | lazy  |

## 7. Inventário: edge functions (44 + `_shared`)

`verify_jwt` lido de `supabase/config.toml`; "quem chama" e "service_role" de `docs/contexto/codigo/edge-functions.json`.

| Função                             | verify_jwt | usa service_role | Quem chama          | Hosts externos                                                                                                                                                                                                                                                                                                       | Linhas | Testes |
| ---------------------------------- | ---------- | ---------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| `accuracy-meta-monitor`            | true       | sim              | sql/cron            |                                                                                                                                                                                                                                                                                                                      | 710    | 4      |
| `accuracy-weekly-digest`           | true       | sim              | front+sql/cron      |                                                                                                                                                                                                                                                                                                                      | 439    | 1      |
| `ai-logistics-assistant`           | true       | sim              | front               | generativelanguage.googleapis.com                                                                                                                                                                                                                                                                                    | 267    | 1      |
| `bitrix24-integration`             | true       | sim              | front+edge          |                                                                                                                                                                                                                                                                                                                      | 413    | 1      |
| `carrier-webhook-receiver`         | **false**  | sim              | front               |                                                                                                                                                                                                                                                                                                                      | 229    | 1      |
| `check-password-breach`            | true       | —                | front               | api.pwnedpasswords.com                                                                                                                                                                                                                                                                                               | 72     | 1      |
| `check-rate-limit`                 | true       | sim              | front               |                                                                                                                                                                                                                                                                                                                      | 149    | 1      |
| `db-health-snapshot`               | true       | sim              | sql/cron            |                                                                                                                                                                                                                                                                                                                      | 55     | 0      |
| `db-health-weekly-report`          | true       | sim              | sql/cron            | api.resend.com                                                                                                                                                                                                                                                                                                       | 242    | 1      |
| `db-regression-monitor`            | true       | sim              | sql/cron            |                                                                                                                                                                                                                                                                                                                      | 91     | 0      |
| `evolution-whatsapp`               | **false**  | —                | front               |                                                                                                                                                                                                                                                                                                                      | 237    | 1      |
| `execute-protocol`                 | true       | sim              | front               |                                                                                                                                                                                                                                                                                                                      | 65     | 1      |
| `external-db-bridge`               | true       | sim              | front               |                                                                                                                                                                                                                                                                                                                      | 378    | 1      |
| `geocode-address`                  | true       | —                | front               | nominatim.openstreetmap.org, photon.komoot.io, viacep.com.br                                                                                                                                                                                                                                                         | 182    | 1      |
| `get-mapbox-token`                 | true       | —                | front               |                                                                                                                                                                                                                                                                                                                      | 35     | 1      |
| `get-weather-data`                 | true       | —                | front               | api.openweathermap.org                                                                                                                                                                                                                                                                                               | 48     | 1      |
| `health`                           | **false**  | sim              | **ninguém**         |                                                                                                                                                                                                                                                                                                                      | 82     | 1      |
| `health-check`                     | **false**  | sim              | front               |                                                                                                                                                                                                                                                                                                                      | 56     | 1      |
| `ingest-biosync`                   | true       | sim              | **ninguém**         |                                                                                                                                                                                                                                                                                                                      | 98     | 1      |
| `lalamove-api`                     | true       | —                | front               | rest.lalamove.com                                                                                                                                                                                                                                                                                                    | 175    | 1      |
| `lalamove-tracking`                | true       | —                | front               | rest.lalamove.com, rest.sandbox.lalamove.com                                                                                                                                                                                                                                                                         | 183    | 1      |
| `lalamove-webhook`                 | **false**  | sim              | **ninguém**         |                                                                                                                                                                                                                                                                                                                      | 207    | 1      |
| `lgpd-erase-user`                  | true       | sim              | front               |                                                                                                                                                                                                                                                                                                                      | 108    | 1      |
| `log-login-attempt`                | true       | sim              | front               |                                                                                                                                                                                                                                                                                                                      | 81     | 1      |
| `log-security-event`               | **false**  | sim              | front               | api.resend.com                                                                                                                                                                                                                                                                                                       | 177    | 1      |
| `melhor-envio-api`                 | **false**  | —                | front               | melhorenvio.com.br, sandbox.melhorenvio.com.br                                                                                                                                                                                                                                                                       | 356    | 1      |
| `new-device-alert`                 | true       | sim              | front               | api.resend.com                                                                                                                                                                                                                                                                                                       | 210    | 1      |
| `nexus-auto-healing`               | true       | sim              | front               |                                                                                                                                                                                                                                                                                                                      | 116    | 1      |
| `nexus-webhook-receiver`           | **false**  | sim              | front               |                                                                                                                                                                                                                                                                                                                      | 170    | 1      |
| `normalize-freight-response`       | true       | sim              | front+edge          | api.openai.com                                                                                                                                                                                                                                                                                                       | 223    | 1      |
| `ocr-receipt-processor`            | true       | sim              | front               |                                                                                                                                                                                                                                                                                                                      | 88     | 1      |
| `predict-delays`                   | true       | sim              | front+edge+sql/cron | generativelanguage.googleapis.com                                                                                                                                                                                                                                                                                    | 399    | 1      |
| `predict-delays-scheduled`         | **false**  | sim              | sql/cron            |                                                                                                                                                                                                                                                                                                                      | 154    | 1      |
| `push-send`                        | true       | sim              | **ninguém**         |                                                                                                                                                                                                                                                                                                                      | 210    | 0      |
| `resend-email`                     | **false**  | —                | front+edge          | api.resend.com                                                                                                                                                                                                                                                                                                       | 77     | 1      |
| `rodonaves-api`                    | true       | sim              | front+sql/cron      | 01wapi.rte.com.br, brasilapi.com.br, customer-apigateway.rte.com.br, dne-apigateway.rte.com.br, payments-apigateway.rte.com.br, pickup-apigateway.rte.com.br, quotation-apigateway.rte.com.br, selfattendance-apigateway.rte.com.br, tracking-apigateway.rte.com.br, unittocity-apigateway.rte.com.br, viacep.com.br | 1730   | 1      |
| `rodonaves-webhook`                | **false**  | sim              | front               |                                                                                                                                                                                                                                                                                                                      | 237    | 1      |
| `scheduled-reports`                | true       | sim              | front               | api.resend.com                                                                                                                                                                                                                                                                                                       | 336    | 1      |
| `secure-store`                     | true       | —                | front               |                                                                                                                                                                                                                                                                                                                      | 97     | 1      |
| `send-password-reset`              | true       | sim              | front               | loggi-flow-v2.vercel.app                                                                                                                                                                                                                                                                                             | 212    | 1      |
| `smart-carrier-selection`          | true       | sim              | front               |                                                                                                                                                                                                                                                                                                                      | 251    | 1      |
| `validate-login`                   | true       | sim              | front               | ip-api.com                                                                                                                                                                                                                                                                                                           | 350    | 1      |
| `webhook-status`                   | **false**  | sim              | front               |                                                                                                                                                                                                                                                                                                                      | 212    | 1      |
| `whatsapp-notification`            | true       | sim              | front+edge          | loggi-flow-v2.vercel.app                                                                                                                                                                                                                                                                                             | 348    | 1      |
| **Leituras diretas desta tabela:** |

- **34 de 44** funções carregam `SUPABASE_SERVICE_ROLE_KEY` — chave que ignora RLS. Cada uma precisa provar que autoriza o chamador antes de usá-la.
- **9 funções** combinam `verify_jwt = false` **com** `service_role`: `carrier-webhook-receiver`, `health`, `health-check`, `lalamove-webhook`, `log-security-event`, `nexus-webhook-receiver`, `predict-delays-scheduled`, `rodonaves-webhook`, `webhook-status`. São a superfície de ataque mais exposta do sistema.
- **2 funções órfãs** (ninguém chama: nem front, nem outra edge, nem SQL/cron): `ingest-biosync` e `push-send`. `push-send` entrou no último commit da `main` (`d37ba30`).
- **3 funções sem nenhum teste**: `db-health-snapshot`, `db-regression-monitor`, `push-send`.
- `_shared/` já oferece o que o resto deveria usar: `auth.ts`, `cors.ts`, `crypto.ts`, `circuitBreaker.ts`, `fetch-with-timeout.ts`, `idempotency.ts`, `contract-validator.ts`, `logger.ts`. **Onde uma função não usa o shared correspondente, é regressão, não escolha.**

## 8. Inventário: banco (reconstruído das migrations — **não do banco ao vivo**)

> **Limitação central desta auditoria.** O projeto Supabase oficial `jvfhclubfpxrtrrazrgr` **não ficou
> acessível nesta sessão**: o MCP `SUPABASE - LOGGI FLOW V2 - MCP` não está carregado e nenhum dos 5
> servidores Supabase disponíveis aponta para esse projeto (verificado com `get_project_url` /
> `db_connection_info`: respondem `pgxfvjmuubtbowutlide`, `doufsxqlfjyuvxuezpln` e dois projetos de outro
> domínio; um quinto devolveu `Management API 401: Invalid access token`). O plugin
> `rls-schema-explorer:supabase` falhou com `ERR_PROXY_TUNNEL`. E `docs/contexto/supabase/` — a fonte que
> o `00-INDEX.md` nomeia como **dona do fato** "o que existe no banco" — **nunca foi gerada**
> ("ainda não existe — o produtor não rodou"). Portanto: **toda afirmação sobre o banco nesta auditoria
> é sobre o que as migrations dizem, não sobre o que está em produção.** Onde isso muda a conclusão, o
> achado está marcado `HIPÓTESE — NÃO VERIFICADO` com o SQL exato de confirmação.

**Números (de `docs/contexto/codigo/banco.json`, reconstruído de 248 migrations + `types.ts`):**

| Objeto                                                     | Quantidade                     |
| ---------------------------------------------------------- | ------------------------------ |
| Tabelas (sem contar partições)                             | **105**                        |
| Partições mensais (`audit_logs`, `rastreamento_historico`) | 37                             |
| Funções SQL                                                | **112**                        |
| Triggers                                                   | **86**                         |
| Cron jobs (`pg_cron`)                                      | **28**                         |
| Views (2 materializadas em `internal`)                     | 6                              |
| Buckets de storage                                         | 5                              |
| Enums de domínio                                           | 7                              |
| Extensões                                                  | `pg_cron`, `pg_net`, `pg_trgm` |

**Aviso emitido pelo próprio gerador, que vale como armadilha para o executor:**
`"52 bloco(s) com DDL dinâmico (EXECUTE format/...) não modelado — policies/colunas criadas
dinamicamente podem faltar; confira no banco vivo"`. Isso **já produziu um falso positivo** que esta
auditoria descartou — ver F-01 em `03-ACHADOS.md`.

### 8.1 Enums de domínio (as máquinas de estado do negócio)

| Enum                   | Valores                                                                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app_role`             | `admin`, `user`                                                                                                                                                       |
| `coleta_status`        | `aguardando_liberacao` → `solicitada` → `em_transito` → `chegou_expedicao` → `conferencia_ok` / `divergencia` → `finalizada`                                          |
| `coleta_tipo`          | `lalamove`, `transportadora`                                                                                                                                          |
| `entrega_status`       | `aguardando_producao` → `pronto_despacho` → `cotacao_frete` → `nf_emitida` → `despachado` → `em_transito` → `saiu_entrega` → `entregue` / `ocorrencia` → `finalizado` |
| `frete_interno_status` | `pendente`, `em_transito`, `entregue`, `atrasado`, `cancelado`                                                                                                        |
| `frete_tipo`           | `cif`, `fob`, `cortesia`                                                                                                                                              |
| `notification_type`    | `info`, `success`, `warning`, `error`, `achievement`                                                                                                                  |

A seta acima é a **ordem em que os valores foram declarados no enum**, não uma transição garantida pelo
banco: um enum do Postgres não impede `aguardando_producao` → `entregue`. Quem (se alguém) impede isso é
assunto de `03-ACHADOS.md`.

### 8.2 Buckets de storage

| Bucket              | Criado em SQL | Usos no código |
| ------------------- | ------------- | -------------- |
| `avatars`           | sim           | 1              |
| `documents`         | sim           | 3              |
| `comprovantes`      | sim           | **0**          |
| `entregas-fotos`    | sim           | **0**          |
| `ocorrencias-fotos` | sim           | **0**          |

Três buckets existem e **nenhum código os usa** — ou a funcionalidade de foto/comprovante não foi
ligada, ou é feita por outro caminho. Ver `03-ACHADOS.md`.

### 8.3 Cron jobs (28)

| Job                                     | Agenda         | Chama edge                 |
| --------------------------------------- | -------------- | -------------------------- |
| `accuracy-meta-monitor-daily`           | `15 8 * * *`   | `accuracy-meta-monitor`    |
| `accuracy-weekly-digest-monday`         | `0 9 * * 1`    | `accuracy-weekly-digest`   |
| `auto-revert-ineffective-indexes-daily` | `30 4 * * *`   | —                          |
| `check-health-score-regression-hourly`  | `15 * * * *`   | —                          |
| `cleanup-cron-job-run-details`          | `30 2 * * *`   | —                          |
| `cleanup-health-snapshots-daily`        | `30 3 * * *`   | —                          |
| `cleanup-notifications-weekly`          | `0 4 * * 0`    | —                          |
| `cleanup-old-delay-predictions`         | `0 3 * * *`    | —                          |
| `cleanup-telemetry-daily`               | `0 3 * * *`    | —                          |
| `compute-db-slo-daily`                  | `15 3 * * *`   | —                          |
| `db-health-snapshot-hourly`             | `0 * * * *`    | `db-health-snapshot`       |
| `db-health-weekly-report`               | `0 8 * * 1`    | `db-health-weekly-report`  |
| `db-regression-monitor-15m`             | `*/15 * * * *` | `db-regression-monitor`    |
| `ensure-future-partitions-monthly`      | `0 2 1 * *`    | —                          |
| `nexus_heartbeat`                       | `*/5 * * * *`  | —                          |
| `nexus_notifications_ttl`               | `0 5 * * 0`    | —                          |
| `nexus_partition_retention`             | `0 3 1 * *`    | —                          |
| `nexus_slow_queries`                    | `0 6 * * *`    | —                          |
| `nexus_telemetry_cleanup`               | `0 4 * * *`    | —                          |
| `persist-global-health-score-daily`     | `0 6 * * *`    | —                          |
| `predict-delays-every-30min`            | `*/30 * * * *` | `predict-delays-scheduled` |
| `refresh-dashboard-views-5m`            | `*/5 * * * *`  | —                          |
| `reindex-hot-indexes-weekly`            | `0 5 * * 0`    | —                          |
| `rte-gateway-health-check`              | `*/15 * * * *` | `rodonaves-api`            |
| `rte-gateway-health-purge`              | `20 3 * * *`   | —                          |
| `rte-slo-daily-rollup`                  | `20 0 * * *`   | —                          |
| `snapshot-query-baseline-daily`         | `30 4 * * *`   | —                          |
| `system-heartbeat-1m`                   | `* * * * *`    | —                          |

### 8.4 Tabelas (105, sem partições)

`RLS` abaixo é o que o **DDL estático** das migrations mostra. Onde diz "não (no DDL estático)", pode
haver `ENABLE` por DDL dinâmico — e no caso das 3 tabelas de F-02 **não há nem CREATE TABLE no repo**.
`FKs` conta colunas com referência declarada.

| Tabela                          | Colunas | FKs | RLS                       | Policies | Operações cobertas              |
| ------------------------------- | ------- | --- | ------------------------- | -------- | ------------------------------- |
| `account_lockouts`              | 7       | 0   | sim                       | 2        | all/select                      |
| `achievements`                  | 12      | 0   | sim                       | 2        | all/select                      |
| `ai_chat_messages`              | 6       | 0   | sim                       | 3        | delete/insert/select            |
| `ai_delay_predictions`          | 8       | 0   | sim                       | 2        | all/select                      |
| `alertas_custo`                 | 11      | 2   | sim                       | 4        | delete/insert/select/update     |
| `allowed_ips`                   | 8       | 1   | sim                       | 5        | all/delete/insert/select/update |
| `architecture_decisions`        | 8       | 0   | sim                       | 1        | all                             |
| `audit_logs`                    | 13      | 0   | sim                       | 3        | insert/select                   |
| `automation_audit_logs`         | 10      | 0   | sim                       | 1        | all                             |
| `bio_sync_alert_rules`          | 9       | 0   | sim                       | 2        | all/select                      |
| `bio_sync_telemetry`            | 10      | 0   | sim                       | 2        | insert/select                   |
| `bitrix_sync_config`            | 12      | 0   | sim                       | 1        | all                             |
| `bitrix_sync_logs`              | 7       | 1   | sim                       | 1        | all                             |
| `business_rules`                | 12      | 1   | sim                       | 2        | all/select                      |
| `business_rules_config`         | 4       | 1   | sim                       | 2        | all/select                      |
| `carrier_rankings`              | 9       | 1   | sim                       | 1        | select                          |
| `client_webhooks`               | 9       | 0   | sim                       | 4        | delete/insert/select/update     |
| `clientes`                      | 16      | 0   | sim                       | 8        | delete/insert/select/update     |
| `coletas`                       | 31      | 2   | sim                       | 5        | all/delete/insert/select/update |
| `comments`                      | 7       | 1   | sim                       | 5        | delete/insert/select/update     |
| `conciliacao_itens_importados`  | 16      | 2   | sim                       | 4        | delete/insert/select/update     |
| `conciliacoes`                  | 16      | 1   | sim                       | 4        | delete/insert/select/update     |
| `contract_test_logs`            | 7       | 0   | sim                       | 1        | insert                          |
| `cotacoes_frete`                | 9       | 2   | sim                       | 4        | delete/insert/select/update     |
| `cotacoes_multicanal`           | 23      | 1   | sim                       | 4        | delete/insert/select/update     |
| `db_health_score_history`       | 10      | 0   | sim                       | 1        | select                          |
| `db_health_snapshots`           | 9       | 0   | sim                       | 1        | select                          |
| `db_slo_daily`                  | 8       | 0   | sim                       | 1        | select                          |
| `delay_predictions_history`     | 16      | 0   | sim                       | 3        | all/select                      |
| `delivery_receipt_audit`        | 11      | 2   | sim                       | 2        | insert/select                   |
| `driver_badges`                 | 6       | 1   | sim                       | 2        | all/select                      |
| `email_verification_tokens`     | 6       | 1   | sim                       | 1        | all                             |
| `entregas`                      | 33      | 2   | sim                       | 5        | all/delete/insert/select/update |
| `error_events`                  | 7       | 1   | sim                       | 2        | insert/select                   |
| `feature_flags`                 | 6       | 0   | sim                       | 2        | all/select                      |
| `fornecedores`                  | 14      | 0   | sim                       | 5        | all/delete/insert/select/update |
| `freight_decisions`             | 10      | 2   | sim                       | 2        | insert/select                   |
| `freight_integration_mappings`  | 8       | 1   | sim                       | 3        | all/select                      |
| `freight_selection_rules`       | 10      | 0   | sim                       | 3        | all/select                      |
| `freight_webhooks`              | 9       | 1   | sim                       | 1        | all                             |
| `fretes_internos`               | 13      | 1   | sim                       | 10       | delete/insert/select/update     |
| `geo_access_rules`              | 6       | 1   | sim                       | 1        | all                             |
| `geo_blocked_attempts`          | 7       | 0   | sim                       | 2        | insert/select                   |
| `geo_blocking_rules`            | 0       | 0   | **não (no DDL estático)** | 2        | all/select                      |
| `geo_blocking_settings`         | 0       | 0   | **não (no DDL estático)** | 2        | all/select                      |
| `idempotency_keys`              | 4       | 0   | sim                       | 1        | select                          |
| `index_proposals`               | 20      | 2   | sim                       | 3        | insert/select/update            |
| `internal.query_baseline`       | 8       | 0   | **não (no DDL estático)** | 0        | —                               |
| `ip_access_rules`               | 8       | 0   | sim                       | 2        | all/select                      |
| `kanban_history`                | 7       | 2   | sim                       | 2        | insert/select                   |
| `known_devices`                 | 12      | 0   | sim                       | 4        | delete/insert/select/update     |
| `login_attempts`                | 7       | 0   | sim                       | 2        | insert/select                   |
| `logistica_reversa`             | 13      | 3   | sim                       | 3        | insert/select/update            |
| `mitigation_actions`            | 17      | 1   | sim                       | 1        | all                             |
| `nexus_tactical_logs`           | 10      | 0   | sim                       | 2        | insert/select                   |
| `notificacoes_custo`            | 9       | 1   | sim                       | 2        | insert/select                   |
| `notification_templates`        | 10      | 0   | sim                       | 1        | all                             |
| `notifications`                 | 10      | 0   | sim                       | 5        | delete/insert/select/update     |
| `ocorrencias`                   | 10      | 2   | sim                       | 4        | delete/insert/select/update     |
| `organizations`                 | 5       | 0   | sim                       | 2        | all/select                      |
| `password_reset_requests`       | 9       | 1   | sim                       | 2        | all/insert                      |
| `performance_metrics`           | 13      | 0   | sim                       | 1        | all                             |
| `permissions`                   | 6       | 0   | sim                       | 2        | all/select                      |
| `prediction_accuracy_settings`  | 11      | 1   | sim                       | 1        | all                             |
| `profiles`                      | 8       | 2   | sim                       | 4        | select/update                   |
| `push_subscriptions`            | 9       | 1   | sim                       | 1        | all                             |
| `query_telemetry`               | 13      | 0   | sim                       | 3        | delete/insert/select            |
| `rastreamento_alertas`          | 11      | 1   | sim                       | 5        | insert/select/update            |
| `rastreamento_historico`        | 12      | 1   | sim                       | 2        | insert/select                   |
| `rate_limit_logs`               | 8       | 1   | sim                       | 3        | delete/insert/select            |
| `remediation_actions`           | 15      | 1   | sim                       | 4        | delete/insert/select/update     |
| `reward_items`                  | 10      | 0   | sim                       | 2        | all/select                      |
| `reward_purchases`              | 7       | 1   | sim                       | 4        | insert/select/update            |
| `reward_redemptions`            | 6       | 1   | sim                       | 2        | insert/select                   |
| `rewards`                       | 8       | 0   | sim                       | 1        | select                          |
| `risk_zones`                    | 9       | 0   | sim                       | 1        | select                          |
| `role_permissions`              | 4       | 1   | sim                       | 2        | all/select                      |
| `rte_gateway_health`            | 8       | 0   | sim                       | 2        | delete/select                   |
| `rte_slo_daily_snapshots`       | 14      | 0   | sim                       | 4        | delete/insert/select/update     |
| `rte_slo_targets`               | 7       | 0   | sim                       | 4        | delete/insert/select/update     |
| `rule_execution_logs`           | 10      | 1   | sim                       | 2        | insert/select                   |
| `scheduled_reports`             | 0       | 0   | **não (no DDL estático)** | 4        | delete/insert/select/update     |
| `security_events`               | 9       | 1   | sim                       | 3        | insert/select                   |
| `sla_alerts`                    | 7       | 0   | sim                       | 1        | all                             |
| `storage.objects`               | 0       | 0   | **não (no DDL estático)** | 16       | delete/insert/select/update     |
| `system_adr`                    | 8       | 0   | sim                       | 1        | all                             |
| `system_contract_schemas`       | 6       | 0   | sim                       | 1        | select                          |
| `system_heartbeat`              | 6       | 0   | sim                       | 1        | select                          |
| `system_integrity_logs`         | 9       | 0   | sim                       | 1        | all                             |
| `tabelas_frete`                 | 12      | 1   | sim                       | 4        | delete/insert/select/update     |
| `telemetry_logs`                | 10      | 1   | sim                       | 2        | insert/select                   |
| `transportadora_rotas`          | 17      | 1   | sim                       | 4        | delete/insert/select/update     |
| `transportadoras`               | 22      | 0   | sim                       | 5        | all/delete/insert/select/update |
| `user_achievements`             | 4       | 2   | sim                       | 3        | insert/select                   |
| `user_gamification`             | 13      | 1   | sim                       | 2        | select/update                   |
| `user_levels`                   | 12      | 2   | sim                       | 4        | insert/select                   |
| `user_notification_preferences` | 13      | 0   | sim                       | 3        | insert/select/update            |
| `user_onboarding`               | 8       | 0   | sim                       | 3        | insert/select/update            |
| `user_ranks`                    | 7       | 0   | sim                       | 1        | select                          |
| `user_roles`                    | 4       | 1   | sim                       | 4        | delete/insert/select/update     |
| `user_sessions`                 | 12      | 1   | sim                       | 5        | delete/insert/select/update     |
| `webauthn_challenges`           | 6       | 1   | sim                       | 2        | all                             |
| `webauthn_credentials`          | 10      | 1   | sim                       | 4        | delete/insert/select/update     |
| `webhook_deliveries`            | 8       | 1   | sim                       | 2        | insert/select                   |
| `webhook_events_processed`      | 5       | 0   | sim                       | 2        | select                          |

## 9. Inventário: CI/CD (17 workflows)

| Workflow                        | Gatilhos                     | Jobs | `continue-on-error` | `\|\| true` |
| ------------------------------- | ---------------------------- | ---- | ------------------- | ----------- |
| `ci.yml` (CI/CD Pipeline)       | push, pull_request           | 9    | 0                   | 0           |
| `security.yml`                  | push, pull_request, schedule | 4    | 0                   | 0           |
| `scripts-tests.yml`             | push, pull_request           | 4    | 0                   | 0           |
| `ci-nexus.yml`                  | push, pull_request           | 3    | 0                   | **1**       |
| `automation-local.yml`          | push, pull_request, dispatch | 4    | 0                   | 0           |
| `dependency-review.yml`         | pull_request                 | 2    | 0                   | 0           |
| `auto-update-pr-branch.yml`     | push                         | 4    | 0                   | 0           |
| `deploy-functions.yml`          | **push(main) + dispatch**    | 3    | 0                   | 0           |
| `types-sync.yml`                | push                         | 7    | **4**               | **1**       |
| `contexto-ia.yml`               | push                         | 9    | **1**               | **2**       |
| `codeql.yml`                    | schedule, dispatch           | 5    | 0                   | 0           |
| `inventario-estado-semanal.yml` | schedule, dispatch           | 4    | **2**               | 0           |
| `branch-hygiene-audit.yml`      | schedule, dispatch           | 3    | 0                   | 0           |
| `settings-guard.yml`            | schedule, dispatch           | 4    | 0                   | 0           |
| `aplicar-migration.yml`         | **dispatch apenas**          | 2    | 0                   | 0           |
| `sync-internal-secret.yml`      | dispatch apenas              | 2    | 0                   | 0           |
| `notifica-falha-main.yml`       | `workflow_run`               | 2    | 0                   | 0           |

**Os 9 jobs de `ci.yml` (os checks obrigatórios):** Security Scan (npm audit + gitleaks), Lint, Type
Check, Warning Budget Gate, Unit & Integration Tests, Agents Docs Integrity, Build Artifact (+ bundle
size), e mais 2.

**Fatos de configuração que mudam como o plano deve ser executado:**

- `strict = false` na proteção de branch: uma PR **desatualizada da `main` mergeia do mesmo jeito**. Um CI verde de PR antiga não prova nada sobre a `main` de hoje.
- Sem revisor obrigatório: o agente mergeia sozinho.
- `delete_branch_on_merge` desligado: branch tem de ser apagada à mão.
- `.husky/` tem só `pre-commit` (`lint-staged`). **Não existe hook `commit-msg`** — o padrão Conventional Commits não é cobrado no caminho, só pelo commitlint na CI.
- `deploy-functions.yml` dispara em **push para `main`** quando `supabase/functions/**` muda. Ver H-03 em `03-ACHADOS.md`: o `AGENTS.md` afirma o contrário.

## 10. Inventário: variáveis de ambiente e segredos

| Nome                            | Onde vive                              | Público?     | Observação                                                                                                                                             |
| ------------------------------- | -------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `VITE_SUPABASE_PROJECT_ID`      | `.env` (**rastreado**) + Vercel        | sim (bundle) | —                                                                                                                                                      |
| `VITE_SUPABASE_URL`             | `.env` (**rastreado**) + Vercel        | sim (bundle) | —                                                                                                                                                      |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env` (**rastreado**) + Vercel        | sim (bundle) | JWT com `"role":"anon"` — **verificado decodificando o payload**; público por design                                                                   |
| `VITE_MAPBOX_TOKEN`             | `.env` (**rastreado**) + Vercel        | sim (bundle) | token de mapa: **público é normal, mas sem restrição de URL vira custo de terceiro**                                                                   |
| `SUPABASE_SERVICE_ROLE_KEY`     | secret de edge function                | **não**      | usado por 34 das 44 funções                                                                                                                            |
| `INTERNAL_FN_SECRET`            | secret de edge function                | não          | auth in-code de `predict-delays-scheduled` e `resend-email`; sincronizado por `sync-internal-secret.yml`                                               |
| `SUPABASE_ACCESS_TOKEN`         | secret de Actions                      | não          | `sbp_...`, usado pelo deploy de edge functions                                                                                                         |
| `ALLOWED_ORIGINS`               | secret de edge (via `_shared/cors.ts`) | não          | —                                                                                                                                                      |
| chaves dos terceiros            | secret de edge function                | não          | Lalamove, Rodonaves, Melhor Envio, Bitrix24, Evolution, Resend, OpenAI, OpenWeather, Upstash — nomes esperados em `scripts/ops/set_missing_secrets.sh` |

**Nenhum segredo de servidor foi encontrado em arquivo rastreado.** As 4 chaves do `.env` e o JWT em
`docs/ops/cron_jobs_origem.json` são todas `anon`. Isso foi confirmado decodificando o campo `role` do
payload — nenhum valor é reproduzido aqui nem em nenhum outro arquivo desta auditoria.

## 11. Inventário: hooks, componentes e serviços

| Item                       | Quantidade | Observação                                                                                                                                                                  |
| -------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Arquivos que exportam hook | **178**    | agrupados por domínio em `src/hooks/<dominio>/` e `src/features/*/hooks/`                                                                                                   |
| Componentes                | **381**    | inclui `src/components/ui/` (shadcn, não auditado como código próprio)                                                                                                      |
| Telas (páginas de topo)    | 61         | + 17 subcomponentes em `src/pages/<area>/`                                                                                                                                  |
| Arquivos de teste          | **130**    | 122 unit, 2 e2e, 1 contrato, 5 pytest                                                                                                                                       |
| Hooks que assinam realtime | **6**      | `useDbRegressionAlerts`, `useRealtime`, `useBoxManagement`, `useMapWeatherSync`, `useSmartAlerts`, `useNexusHealth` — toda assinatura precisa de `removeChannel` no cleanup |

**Cobertura de teste por tipo de artefato (de `docs/contexto/codigo/testes.json`, campo `sem_teste`):**

| Artefato             | Sem nenhum teste | Total | % sem teste |
| -------------------- | ---------------- | ----- | ----------- |
| **Telas**            | **61**           | 61    | **100%**    |
| **Arquivos de hook** | **172**          | 178   | **96,6%**   |
| Edge functions       | 3                | 44    | 6,8%        |
| Serviços             | 5                | —     | —           |

Ou seja: os 130 arquivos de teste cobrem sobretudo utilitários e edge functions. **Nenhuma tela do
sistema tem teste**, e os hooks — onde vivem as regras de busca, cache e escrita — estão praticamente
descobertos. Isso define o que esta auditoria pôde executar e o que só pôde rastrear.

## 12. Inventário: integrações externas

| Terceiro                     | Para que serve no negócio         | Onde entra                                                            |
| ---------------------------- | --------------------------------- | --------------------------------------------------------------------- |
| **Lalamove**                 | coleta e entrega expressa         | `lalamove-api`, `lalamove-tracking`, `lalamove-webhook`               |
| **Rodonaves**                | transportadora (frete e rastreio) | `rodonaves-api`, `rodonaves-webhook`, cron `rte-gateway-health-check` |
| **Melhor Envio**             | cotação de frete                  | `melhor-envio-api` (`verify_jwt=false`)                               |
| **Evolution API / A-Ticket** | WhatsApp ao cliente               | `evolution-whatsapp`, `whatsapp-notification`                         |
| **Resend**                   | e-mail transacional               | `resend-email` (só interno)                                           |
| **Bitrix24**                 | CRM                               | `bitrix24-integration`                                                |
| **Mapbox**                   | mapa e rotas                      | `get-mapbox-token`, `VITE_MAPBOX_TOKEN`                               |
| **OpenWeather**              | clima na rota                     | `get-weather-data`                                                    |
| **OpenAI**                   | assistente e predição             | `ai-logistics-assistant`, `predict-delays`, `ocr-receipt-processor`   |
| **Upstash Redis**            | rate limit                        | `check-rate-limit`                                                    |
| **Nexus** (interno)          | auto-healing e telemetria         | `nexus-auto-healing`, `nexus-webhook-receiver`, `execute-protocol`    |

## 13. Regras de negócio localizadas

A fonte declarada é `docs/contexto/regras/07-REGRAS-DE-NEGOCIO.md` (branch `contexto`), gerada por
automação a partir de validações, constraints, enums e testes. Esta auditoria tratou cada regra de lá
como **alegação a confirmar no código**, não como fato — conforme o próprio protocolo do `00-INDEX.md`
("item listado como NÃO VERIFICADO: confirme na fonte dona"). O resultado dessa conferência, incluindo
onde a regra **deveria** estar e não está, é o grupo de achados **R-\*** em `03-ACHADOS.md`.

---

# 14. REGISTRO DE COBERTURA

Cada item do inventário com status **revisado** ou **não revisado + motivo**. A auditoria só pode se dizer
exaustiva na medida em que esta tabela mostra o que ficou de fora — e ela mostra bastante.

## 14.1 Por camada

| Camada                                       | Itens                                                                   | Status                                    | Como foi coberta / por que não                                                                                                                                                                                                                                                                |
| -------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Rotas**                                    | 61 rotas, 61 telas de topo                                              | **revisado**                              | `src/App.tsx` lido por inteiro; acesso de cada rota extraído da prop real; comparada a lista de arquivos de `src/pages/` com as rotas registradas (sem rota órfã)                                                                                                                             |
| **Interface — fluxos principais**            | 13 telas                                                                | **revisado**                              | `Coletas`, `Envios`, `Despachos`, `KanbanEntregas`, `CotacaoFrete`, `CotacaoMultiCanal`, `Clientes`, `Fornecedores`, `Transportadoras`, `Ocorrencias`, `LogisticaReversa`, `FretesInternos`, `ImportacaoMassa` — cobertura C/R/U/D e estados em `02-CENARIOS.md` §7 e no grupo de achados R/D |
| **Interface — demais telas**                 | 48 telas                                                                | **não revisado**                          | Fora do escopo dos fluxos principais. Varreduras transversais (`innerHTML`, `localStorage`, `target=_blank`, upload) cobriram todo o `src/`, mas **não houve leitura tela por tela**. É a maior lacuna desta auditoria                                                                        |
| **Hooks — dados e realtime**                 | 6 hooks de realtime; 173 mutations em 59 arquivos; 178 arquivos de hook | **revisado (por dimensão)**               | Varredura dirigida: assinatura/limpeza de realtime, invalidação de cache, update otimista, erro engolido, temporizadores. Não houve leitura integral dos 178 arquivos                                                                                                                         |
| **Serviços e clients**                       | `src/services/`, `src/integrations/`, `src/lib/`                        | **revisado (parcial)**                    | Caminhos de upload e `storageService` lidos; paginação/N+1/`select("*")` varridos em todo o `src/`. Não houve leitura integral                                                                                                                                                                |
| **Edge functions — autenticação**            | 12 com `verify_jwt = false`                                             | **revisado**                              | `index.ts` de cada uma + `_shared/auth.ts`, `_shared/webhookSignature.ts`, `_shared/crypto.ts`. Achados S-01 a S-06                                                                                                                                                                           |
| **Edge functions — robustez**                | 44 funções                                                              | **revisado (por dimensão)**               | Validação de entrada, idempotência, tempo limite, formato de erro, CORS, disjuntor — varridos em todas as 44. Alguns arquivos longos foram lidos só nos blocos relevantes (declarado em B-04 e S-04)                                                                                          |
| **Banco — RLS e policies**                   | 105 tabelas + 37 partições                                              | **não revisado no estado real**           | Reconstruído das migrations e de `types.ts`. **O banco ao vivo não ficou acessível** (ver §8). F-01 mostra que essa fonte produz falso positivo; F-02 e F-03 ficaram como hipótese                                                                                                            |
| **Banco — funções**                          | 119 funções distintas nas migrations                                    | **revisado**                              | Script próprio levantou a **última** definição de cada nome e checou `SECURITY DEFINER` + `SET search_path`: 83 corretas, 2 sem, 34 não-definer. EXECUTADO                                                                                                                                    |
| **Banco — triggers**                         | 86                                                                      | **revisado (parcial)**                    | Levantados todos os `CREATE TRIGGER` em `coletas` e `entregas` (para C-01). Os demais não foram lidos um a um                                                                                                                                                                                 |
| **Banco — cron**                             | 28 jobs                                                                 | **revisado**                              | Inventariados em §8.3 a partir de `banco.json`. Execução real não verificada (sem banco)                                                                                                                                                                                                      |
| **Banco — índices**                          | —                                                                       | **não revisado no estado real**           | P-05 e P-06 saem das migrations. P-06 é a prova do limite: 7 de 12 "duplicados" já tinham sido removidos                                                                                                                                                                                      |
| **Banco — views**                            | 6                                                                       | **não revisado**                          | Inventariadas, não auditadas. Duas são materializadas em `internal` e são atualizadas por cron                                                                                                                                                                                                |
| **Storage**                                  | 5 buckets                                                               | **revisado**                              | Uso cruzado com o código (A-10) e policies do bucket `documents` lidas (A-11)                                                                                                                                                                                                                 |
| **Integrações externas**                     | 11 terceiros                                                            | **revisado (pelo lado do código)**        | Assinatura, deduplicação, tempo limite, disjuntor e segredo no cliente. O comportamento dos terceiros em si não foi exercitado                                                                                                                                                                |
| **Variáveis de ambiente**                    | 4 públicas + os segredos de edge                                        | **revisado (nomes e tipos)**              | Tipo de cada chave versionada confirmado decodificando o payload. **Valores dos segredos de servidor não são legíveis** — S-05, S-08 e H-14 ficaram como hipótese                                                                                                                             |
| **CI/CD**                                    | 17 workflows, 10 required checks                                        | **revisado**                              | Workflows lidos; proteção de branch confirmada pela API do GitHub (EXECUTADO)                                                                                                                                                                                                                 |
| **Testes**                                   | 130 arquivos                                                            | **revisado (inventário)**                 | Cobertura por tipo de artefato medida. A suíte **não foi executada por inteiro** — e, como nenhuma tela tem teste, executá-la não validaria nenhuma jornada                                                                                                                                   |
| **Documentação**                             | ~20 documentos de raiz e `docs/`                                        | **revisado (por amostragem verificável)** | Duas afirmações concretas por documento, confirmadas ou refutadas no código. Grupo H                                                                                                                                                                                                          |
| **Scripts**                                  | 128 arquivos em `scripts/**`                                            | **revisado**                              | Cruzados com workflows, `package.json` e `scripts/automation.config.json`. Dois órfãos reais (D-04)                                                                                                                                                                                           |
| **Acessibilidade, celular, desempenho real** | —                                                                       | **não revisado**                          | Exige navegador contra a aplicação publicada, o que significaria exercitar **produção**. Ver `02-CENARIOS.md` §10                                                                                                                                                                             |
| **Lovable**                                  | `.lovable/`, `lovable-tagger` no build                                  | **não revisado**                          | Dívida declarada no `AGENTS.md`; não foi aprofundada                                                                                                                                                                                                                                          |
| **PWA / service worker**                     | —                                                                       | **não revisado**                          | Fora do escopo priorizado                                                                                                                                                                                                                                                                     |
| **i18n**                                     | `src/i18n.ts`                                                           | **não revisado**                          | Apenas a divergência de documentação (H-02)                                                                                                                                                                                                                                                   |

## 14.2 As cinco lacunas que mudam o que esta auditoria pode afirmar

1. **O banco ao vivo.** Nenhuma policy, índice, constraint ou dado foi lido no projeto de produção. É a
   camada onde a autorização de verdade acontece neste sistema — e é a que ficou de fora.
2. **48 das 61 telas** não foram lidas individualmente.
3. **Nenhuma escrita foi executada.** Todo cenário de gravação está RASTREADO.
4. **Os segredos de edge function** não são legíveis, o que deixa S-05, S-08 e parte de H-14 em hipótese.
5. **Nada foi verificado em navegador** — acessibilidade, celular e tempo de carregamento real.

## 14.3 O que a auditoria mediu de fato (lista completa)

Em `02-CENARIOS.md` §0. São 11 verificações EXECUTADAS, todas sem tocar dado: gates de qualidade,
auditoria de dependências, visibilidade do repositório, tipo das chaves versionadas, proteção de branch e o
levantamento das 119 funções SQL.

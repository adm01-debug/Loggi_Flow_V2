# Prod Readiness — Loggi_Flow_V2

Fechamento: 2026-11-14 · main `a49bf31e` (igual origin/main) · PR abertas atuais: #150 (automation/inventario-estado, não relacionada).

Regra: regressão = item que deixou de ser OK. Toda prova é de comando/query/request real deste documento.

## 1. Inventário e cobertura

### Front (rotas/telas) — 61 rotas · 60 páginas (`src/App.tsx`)
Rotas: /auth / /fretes-internos /fornecedores /clientes /ocorrencias /envios /coletas
/transportadoras /despachos /relatorios /conquistas /ranking /configuracoes /perfil
/gestao-box /sla-dashboard /calendario /cotacao-frete /custos /alertas-custo
/mapa-rotas /rastreamento-motorista /notificacoes /analytics /loja /conciliacao
/rotas-transportadoras /logistica-reversa /gestao-rodonaves /melhor-envio
/dashboard-executivo /inteligencia-frete /cotacao-multicanal /dashboard-cotacoes
/painel-otif /painel-sla /kanban-entregas /relatorio-pdf /conciliacao-automatica
/importacao-massa /automacao-regras /central-rastreamento /rastreamento/:id /audit-trail
/api-docs /gerenciamento-usuarios /aprovacao-reset-senha /seguranca /rate-limit
/admin/telemetria /webhooks /bitrix24 /admin/adr /admin/db-health /admin/quality-gate
/config-frete /exportacao /rastrear /reset-password *
**OK** Provas: `len(routes)=61`, `len(lazy)=62`, 60 páginas únicas (extração App.tsx);
front deployado responde 200 (`https://loggi-flow-v2.vercel.app/`, domínio verificado).

### Edge Functions — 43 deployadas + `_shared`
**OK** `GET /functions` → 43 ACTIVE; local 44 dirs; diff API↔local = 0.

### Banco — 135 objetos public (129 tabelas + 2 particionadas + 4 views)
**OK** RLS: 0 sem RLS, 0 com RLS sem policy, 315 policies, 0 grants a PUBLIC, 2 sequences.
**OK** migrations banco 243 = repo 243 (0 de diferença por timestamp).
Prova: queries Management API (counts acima).

### Workflows — 16 ativos
auto-update-pr-branch, automation-local, branch-hygiene-audit, ci-nexus, ci, codeql,
contexto-ia, deploy-functions, e2e, inventario-estado-semanal, notifica-falha-main,
scripts-tests, security, settings-guard, sync-internal-secret, types-sync.
**OK (green)** CI/CD, automation-local, scripts-tests, security, ci-nexus,
sync-internal-secret, types-sync, codeql (último run success).
**BLOQUEADO/fila** deploy edge functions (43511750479) — fila de runners; workflow do main já contém `--yes` (causa das 3 falhas pré-#144).

### Integrações/crons — 28 crons ativos
**OK** 0 execuções com erro em 7 dias (`cron.job_run_details`).

## 2. Qualidade (main a49bf31e, local)
**OK** exit 0: typecheck, lint (102≤105), lint:budget, test:coverage (257 testes/30 arquivos),
build (32.41s, PWA 253 entries), validate:no-console. Nenhum teste removido/pulado.

## 3. Produção no ar
**OK** health + health-check → 200 healthy (db/auth/storage true). Front 200. Crons sem erro 7d.

## 4. Sem "pela metade"
**OK** zero TODO/FIXME/WIP/HACK/XXX em produção.
**BLOQUEADO (decisão dono)** mocks reais de UI: `src/components/freight/AIFreightForecasting.tsx:12`
(gráfico+insights fake) e `src/components/map/MapIntelligenceOverlay.tsx:14` (overlay fake).
Não são removíveis sem fonte real de dados — exige decisão de negócio (evitar regressão).
**OK** `.env` versionado: 4 chaves VITE_* publishable, não secretas.
**BLOQUEADO (decisão dono)** remover `.env` do versionamento (higiene/segurança, regra 8).
**BLOQUEADO (Data Integrity)** `ai_delay_predictions` = 0 registros: a previsão de atrasos roda
(66x succeeded em 7d, 0 erro) mas gera 0 predições porque a fonte está vazia —
`predict-delays/index.ts` lê de `entregas`, `coletas`, `ocorrencias`, todas com 0 linhas.
Nenhuma tabela public de transporte tem dados (`manifest` fica em `audit_tmp`).
Requer conectar a ingestão de transportes (decisão de negócio).

## 5. Aguardando / a decidir
- Deploy edge functions: success (run 43511750479, main com --yes do #144) — 43 functions ACTIVE.
- Re-disparados em main atual: inventário semanal (43512924603) = success; branch-hygiene
  (43512924390) = success; settings-guard (43512924384) = failure por 403 (monitoramento agendado).
- Preview "perimetro-leitura": projeto NÃO existe na conta Vercel (token vcp_); item sem efeito.
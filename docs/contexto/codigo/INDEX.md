# Contexto do projeto para agentes de IA

GERADO AUTOMATICAMENTE por scripts/ai-context/gerar.mjs — não editar à mão; será sobrescrito.
Publicado pelo workflow .github/workflows/contexto-ia.yml em docs/contexto/codigo/ da branch `contexto`. Leia: git fetch origin contexto && git show origin/contexto:docs/contexto/00-INDEX.md Gere local com `node scripts/ai-context/gerar.mjs`. Commit-base: `285036298fe3554601579f25007f01bc6b452634` (2026-11-26T20:33:50-03:00).

## Como usar (leia antes de planejar ou executar qualquer tarefa)
1. **Tela/rota/menu** → `rotas.json` (url/vista/menu → arquivo → hooks → tabelas → edges; `rotas_http_backend` para APIs) e `modulos.json` (módulo inteiro + dependências entre módulos).
2. **Hook/serviço/lógica** → `hooks.json`, `logica.json` (quem usa, o que toca, se tem teste).
3. **Edge function / serverless** → `edge-functions.json` (verify_jwt, tabelas, env, quem chama, órfãs).
4. **Banco** → `banco.json` (colunas, RLS, policies, índices, FKs, triggers, cron jobs, buckets, drift migration×types, uso no código) — visão do código; para o banco vivo use o MCP.
5. **Antes de criar arquivo** → `convencoes.json` (onde ficam as coisas, nomenclatura, alias), `componentes.json` (nomes duplicados, órfãos), `grafo.json` (hubs, ciclos de import) e `grafo-graphify.json` (grafo por AST: comunidades, símbolos mais chamados, comunidade de cada arquivo).
6. **CI/scripts/deploy/env/integrações/permissões/flags** → `ferramentas.json` e `scripts.json`.
7. **Antes de abrir PR** → `testes.json` (o que tem e não tem teste, onde os testes ficam), `baseline.json` (alertas, TODOs, hotspots, últimos commits).
Os JSONs são grandes: filtre com `grep`/`jq` pelo caminho/arquivo/tabela da sua tarefa; não carregue tudo.

## Stack
- linguagens: TypeScript (904), SQL (298), Markdown (268), JavaScript (94), JSON (35), YAML (22), Shell (9), Python (8)
- linguagem_principal: TypeScript
- framework: React
- backend_http: n/d
- bundler: Vite
- roteador: react-router
- banco: Supabase
- testes: vitest, playwright
- ui: tailwind, radix/shadcn
- estado: react-query
- gerenciador_pacotes: npm
- node: n/d
- python: n/d
- deploy: vercel
- monorepo: n/d
- pastas_fonte: src

## Números
| item | qtd |
|---|---|
| arquivos_total | 1653 |
| arquivos_codigo | 1005 |
| linhas_codigo | 191118 |
| rotas | 61 |
| rotas_http_backend | 0 |
| vistas_por_id | 0 |
| itens_menu | 87 |
| modulos | 74 |
| componentes | 383 |
| hooks | 179 |
| edge_functions | 43 |
| tabelas | 137 |
| migrations | 272 |
| cron_jobs | 30 |
| testes | 224 |
| workflows | 18 |
| scripts | 69 |
| docs_md | 268 |

## Onde ficam as coisas
- telas: src/pages (61)
- componentes: src/components (257), src/pages (77), src/features (41)
- hooks: src/hooks (124), src/features (41), src/components (14)
- servicos_logica: src/lib (38), src/services (5), src/utils (4)
- testes: co-localizado (*.test) (93), tests/ (77), outro (54)
- edge_functions: supabase/functions
- migrations: supabase/migrations
- scripts: scripts/ci (17), scripts/db-audit (15), scripts/audit (5)
- docs: docs (34), (raiz) (9), .github (1)
- nomenclatura: {"componentes":"PascalCase (85%)","hooks":"use + PascalCase","servicos":"camelCase (96%)","edge_functions":"kebab-case (98%)","tabelas":"snake_case (88%)"}
- instruções para agentes no repo: AGENTS.md, CLAUDE.md

## Módulos (menu → domínio)
| módulo | itens de menu | telas/rotas | arquivos | hooks locais | edges | tabelas |
|---|---|---|---|---|---|---|
| components/common | 0 | 0 | 45 | 16 | 2 | 11 |
| components/dashboard | 0 | 0 | 17 | 30 | 2 | 23 |
| components/freight | 0 | 0 | 18 | 96 | 19 | 54 |
| components/layout | 0 | 0 | 7 | 23 | 3 | 18 |
| components/map | 0 | 0 | 6 | 7 | 0 | 2 |
| components/melhorenvio | 0 | 0 | 18 | 6 | 1 | 3 |
| components/notifications | 0 | 0 | 6 | 7 | 1 | 7 |
| components/onboarding | 0 | 0 | 6 | 4 | 0 | 7 |
| components/predictions | 0 | 0 | 13 | 14 | 2 | 13 |
| components/rodonaves | 0 | 0 | 18 | 6 | 1 | 6 |
| components/security | 0 | 0 | 24 | 12 | 3 | 17 |
| components/transportadoras | 0 | 0 | 6 | 1 | 1 | 4 |
| components/ui | 0 | 0 | 55 | 4 | 0 | 0 |
| features/db-observability | 0 | 0 | 81 | 47 | 0 | 6 |
| hooks/analytics | 0 | 0 | 11 | 12 | 1 | 13 |
| hooks/auth | 0 | 0 | 8 | 8 | 1 | 8 |
| hooks/common | 0 | 0 | 20 | 22 | 0 | 10 |
| hooks/data | 0 | 0 | 9 | 8 | 0 | 12 |
| hooks/integrations | 0 | 0 | 5 | 3 | 5 | 6 |
| hooks/logistics | 0 | 0 | 41 | 41 | 8 | 35 |
| hooks/notifications | 0 | 0 | 6 | 7 | 2 | 7 |
| hooks/security | 0 | 0 | 6 | 9 | 7 | 8 |
| hooks/ui | 0 | 0 | 6 | 9 | 0 | 7 |
| lib | 0 | 0 | 20 | 0 | 0 | 0 |
| lib/predictions | 0 | 0 | 6 | 0 | 0 | 0 |
| lib/rodonaves | 0 | 0 | 11 | 0 | 0 | 0 |
| pages | 79 | 59 | 59 | 139 | 35 | 85 |
| pages/admin | 2 | 2 | 2 | 69 | 3 | 21 |
| pages/auth | 0 | 0 | 5 | 2 | 3 | 1 |

## Rotas (url → arquivo)
- `/` [tela] → src/pages/Index.tsx (protegida)
- `/*` [tela] → src/pages/NotFound.tsx
- `/admin/adr` [tela] → src/pages/AdminADR.tsx (protegida)
- `/admin/db-health` [tela] → src/pages/admin/DbHealth.tsx (protegida)
- `/admin/quality-gate` [tela] → src/pages/admin/QualityGate.tsx (protegida)
- `/admin/telemetria` [tela] → src/pages/AdminTelemetria.tsx (protegida)
- `/alertas-custo` [tela] → src/pages/AlertasCusto.tsx (protegida)
- `/analytics` [tela] → src/pages/Analytics.tsx (protegida)
- `/api-docs` [tela] → src/pages/APIDocumentation.tsx (protegida)
- `/aprovacao-reset-senha` [tela] → src/pages/AprovacaoResetSenha.tsx (protegida)
- `/audit-trail` [tela] → src/pages/AuditTrail.tsx (protegida)
- `/auth` [tela] → src/pages/Auth.tsx
- `/automacao-regras` [tela] → src/pages/AutomacaoRegras.tsx (protegida)
- `/bitrix24` [tela] → src/pages/IntegracaoBitrix.tsx (protegida)
- `/calendario` [tela] → src/pages/CalendarioLogistico.tsx (protegida)
- `/central-rastreamento` [tela] → src/pages/CentralRastreamento.tsx (protegida)
- `/clientes` [tela] → src/pages/Clientes.tsx (protegida)
- `/coletas` [tela] → src/pages/Coletas.tsx (protegida)
- `/conciliacao` [tela] → src/pages/ConciliacaoFinanceira.tsx (protegida)
- `/conciliacao-automatica` [tela] → src/pages/ConciliacaoAutomatica.tsx (protegida)
- `/config-frete` [tela] → src/pages/ConfiguracoesFrete.tsx (protegida)
- `/configuracoes` [tela] → src/pages/Configuracoes.tsx (protegida)
- `/conquistas` [tela] → src/pages/Conquistas.tsx (protegida)
- `/cotacao-frete` [tela] → src/pages/CotacaoFrete.tsx (protegida)
- `/cotacao-multicanal` [tela] → src/pages/CotacaoMultiCanal.tsx (protegida)
- `/custos` [tela] → src/pages/CustosDashboard.tsx (protegida)
- `/dashboard-cotacoes` [tela] → src/pages/DashboardCotacoes.tsx (protegida)
- `/dashboard-executivo` [tela] → src/pages/DashboardExecutivo.tsx (protegida)
- `/despachos` [tela] → src/pages/Despachos.tsx (protegida)
- `/envios` [tela] → src/pages/Envios.tsx (protegida)
- `/exportacao` [tela] → src/pages/ExportacaoDados.tsx (protegida)
- `/fornecedores` [tela] → src/pages/Fornecedores.tsx (protegida)
- `/fretes-internos` [tela] → src/pages/FretesInternos.tsx (protegida)
- `/gerenciamento-usuarios` [tela] → src/pages/GerenciamentoUsuarios.tsx (protegida)
- `/gestao-box` [tela] → src/pages/GestaoBox.tsx (protegida)
- `/gestao-rodonaves` [tela] → src/pages/GestaoRodonaves.tsx (protegida)
- `/importacao-massa` [tela] → src/pages/ImportacaoMassa.tsx (protegida)
- `/inteligencia-frete` [tela] → src/pages/InteligenciaFrete.tsx (protegida)
- `/kanban-entregas` [tela] → src/pages/KanbanEntregas.tsx (protegida)
- `/logistica-reversa` [tela] → src/pages/LogisticaReversa.tsx (protegida)
- `/loja` [tela] → src/pages/LojaRecompensas.tsx (protegida)
- `/mapa-rotas` [tela] → src/pages/MapaRotas.tsx (protegida)
- `/melhor-envio` [tela] → src/pages/GestaoMelhorEnvio.tsx (protegida)
- `/notificacoes` [tela] → src/pages/Notificacoes.tsx (protegida)
- `/ocorrencias` [tela] → src/pages/Ocorrencias.tsx (protegida)
- `/painel-otif` [tela] → src/pages/PainelOTIF.tsx (protegida)
- `/painel-sla` [tela] → src/pages/PainelSLA.tsx (protegida)
- `/perfil` [tela] → src/pages/Profile.tsx (protegida)
- `/ranking` [tela] → src/pages/Ranking.tsx (protegida)
- `/rastreamento-motorista` [tela] → src/pages/RastreamentoMotorista.tsx (protegida)
- `/rastreamento/:id` [tela] → src/pages/RastreamentoRealTime.tsx (protegida)
- `/rastrear` [tela] → src/pages/RastreamentoPublico.tsx
- `/rate-limit` [tela] → src/pages/RateLimitDashboard.tsx (protegida)
- `/relatorio-pdf` [tela] → src/pages/RelatorioPDF.tsx (protegida)
- `/relatorios` [tela] → src/pages/Relatorios.tsx (protegida)
- `/reset-password` [tela] → src/pages/ResetPassword.tsx
- `/rotas-transportadoras` [tela] → src/pages/RotasTransportadoras.tsx (protegida)
- `/seguranca` [tela] → src/pages/Seguranca.tsx (protegida)
- `/sla-dashboard` [tela] → src/pages/SLADashboard.tsx (protegida)
- `/transportadoras` [tela] → src/pages/Transportadoras.tsx (protegida)
- `/webhooks` [tela] → src/pages/GestaoWebhooks.tsx (protegida)

## Rotas HTTP de backend
- (nenhum)

## Vistas por id (menu/ViewRouter → arquivo)
- (nenhum)

## Edge functions
- `accuracy-meta-monitor` — tabelas: notifications, prediction_accuracy_settings; chamada por 0 arquivo(s) do front, por SQL/cron
- `accuracy-weekly-digest` — tabelas: notifications, prediction_accuracy_settings; chamada por 1 arquivo(s) do front, por SQL/cron
- `ai-logistics-assistant` — tabelas: entregas, ocorrencias, transportadoras; chamada por 2 arquivo(s) do front
- `bitrix24-integration` — tabelas: audit_logs, bitrix_sync_config, business_rules_config; chamada por 3 arquivo(s) do front
- `carrier-webhook-receiver` (verify_jwt=false) — tabelas: automation_audit_logs, entregas, ocorrencias, webhook_inbound_failures; chamada por 1 arquivo(s) do front
- `check-password-breach` — tabelas: -; chamada por 2 arquivo(s) do front
- `check-rate-limit` — tabelas: rate_limit_logs, security_events; chamada por 1 arquivo(s) do front
- `db-health-snapshot` — tabelas: db_health_snapshots; chamada por 0 arquivo(s) do front, por SQL/cron
- `db-health-weekly-report` — tabelas: db_slo_daily, profiles, user_roles; chamada por 0 arquivo(s) do front, por SQL/cron
- `db-regression-monitor` — tabelas: feature_flags, nexus_tactical_logs, notifications, user_roles; chamada por 0 arquivo(s) do front, por SQL/cron
- `evolution-whatsapp` (verify_jwt=false) — tabelas: audit_logs; chamada por 1 arquivo(s) do front
- `execute-protocol` — tabelas: -; chamada por 1 arquivo(s) do front
- `external-db-bridge` — tabelas: query_telemetry; chamada por 1 arquivo(s) do front
- `geocode-address` — tabelas: -; chamada por 4 arquivo(s) do front
- `get-weather-data` — tabelas: -; chamada por 1 arquivo(s) do front
- `health` (verify_jwt=false) — tabelas: profiles; chamada por 0 arquivo(s) do front
- `health-check` (verify_jwt=false) — tabelas: profiles; chamada por 1 arquivo(s) do front
- `ingest-biosync` — tabelas: bio_sync_alert_rules, bio_sync_telemetry, nexus_tactical_logs; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `lalamove-api` — tabelas: -; chamada por 2 arquivo(s) do front
- `lalamove-tracking` — tabelas: -; chamada por 2 arquivo(s) do front
- `lalamove-webhook` (verify_jwt=false) — tabelas: coletas, rastreamento_alertas, rastreamento_historico, webhook_events_processed; chamada por 0 arquivo(s) do front
- `lgpd-erase-user` — tabelas: audit_logs, profiles, user_roles; chamada por 1 arquivo(s) do front
- `log-login-attempt` — tabelas: login_attempts; chamada por 1 arquivo(s) do front
- `log-security-event` (verify_jwt=false) — tabelas: security_events; chamada por 1 arquivo(s) do front
- `melhor-envio-api` (verify_jwt=false) — tabelas: -; chamada por 3 arquivo(s) do front
- `new-device-alert` — tabelas: security_events; chamada por 1 arquivo(s) do front
- `nexus-auto-healing` — tabelas: coletas, entregas, system_heartbeat, system_integrity_logs; chamada por 1 arquivo(s) do front
- `nexus-webhook-receiver` (verify_jwt=false) — tabelas: cotacoes_multicanal, transportadoras; chamada por 1 arquivo(s) do front
- `normalize-freight-response` — tabelas: cotacoes_multicanal, prediction_accuracy_settings, transportadoras, user_notification_preferences; chamada por 3 arquivo(s) do front
- `ocr-receipt-processor` — tabelas: delivery_receipt_audit; chamada por 1 arquivo(s) do front
- `predict-delays` — tabelas: ai_delay_predictions, coletas, delay_predictions_history, entregas, ocorrencias, prediction_accuracy_settings, user_notification_preferences; chamada por 2 arquivo(s) do front, por SQL/cron
- `predict-delays-scheduled` (verify_jwt=false) — tabelas: delay_predictions_history, notifications, user_roles; chamada por 0 arquivo(s) do front, por SQL/cron
- `push-send` — tabelas: push_subscriptions; chamada por 1 arquivo(s) do front
- `resend-email` (verify_jwt=false) — tabelas: -; chamada por 1 arquivo(s) do front
- `rodonaves-api` — tabelas: entregas, ocorrencias, rte_gateway_health; chamada por 5 arquivo(s) do front, por SQL/cron
- `rodonaves-webhook` (verify_jwt=false) — tabelas: entregas, ocorrencias, webhook_events_processed; chamada por 1 arquivo(s) do front
- `scheduled-reports` — tabelas: coletas, entregas, scheduled_reports; chamada por 1 arquivo(s) do front
- `secure-store` — tabelas: -; chamada por 1 arquivo(s) do front
- `send-password-reset` — tabelas: password_reset_requests, user_roles; chamada por 2 arquivo(s) do front
- `smart-carrier-selection` — tabelas: entregas, freight_decisions, freight_selection_rules, tabelas_frete; chamada por 2 arquivo(s) do front
- `validate-login` — tabelas: geo_access_rules, geo_blocked_attempts, ip_access_rules, login_attempts; chamada por 1 arquivo(s) do front
- `webhook-status` (verify_jwt=false) — tabelas: audit_logs, client_webhooks, webhook_deliveries; chamada por 2 arquivo(s) do front
- `whatsapp-notification` — tabelas: audit_logs, coletas, entregas; chamada por 1 arquivo(s) do front

## Cron jobs (pg_cron / vercel)
- `accuracy-meta-monitor-daily` 15 8 * * * → edge accuracy-meta-monitor (20260901000000_cron_jobs_canonical.sql)
- `accuracy-weekly-digest-monday` 0 9 * * 1 → edge accuracy-weekly-digest (20260901000000_cron_jobs_canonical.sql)
- `auto-revert-ineffective-indexes-daily` 30 4 * * * (20260901000000_cron_jobs_canonical.sql)
- `check-health-score-regression-hourly` 15 * * * * (20260901000000_cron_jobs_canonical.sql)
- `cleanup-contract-test-logs-daily` 45 3 * * * (20261126120000_retencao_logs_contrato_e_webhook.sql)
- `cleanup-cron-job-run-details` 30 2 * * * (20260901000000_cron_jobs_canonical.sql)
- `cleanup-health-snapshots-daily` 30 3 * * * (20260901000000_cron_jobs_canonical.sql)
- `cleanup-notifications-weekly` 0 4 * * 0 (20260901000000_cron_jobs_canonical.sql)
- `cleanup-old-delay-predictions` 0 3 * * * (20260901000000_cron_jobs_canonical.sql)
- `cleanup-telemetry-daily` 0 3 * * * (20260901000000_cron_jobs_canonical.sql)
- `compute-db-slo-daily` 15 3 * * * (20260901000000_cron_jobs_canonical.sql)
- `db-health-snapshot-hourly` 0 * * * * → edge db-health-snapshot (20260901000000_cron_jobs_canonical.sql)
- `db-health-weekly-report` 0 8 * * 1 → edge db-health-weekly-report (20260901000000_cron_jobs_canonical.sql)
- `db-regression-monitor-15m` */15 * * * * → edge db-regression-monitor (20260901000000_cron_jobs_canonical.sql)
- `ensure-future-partitions-monthly` 0 2 1 * * (20260901000000_cron_jobs_canonical.sql)
- `nexus_heartbeat` */5 * * * * (20260711153319_785edc4c-3e2b-4a6e-895e-7ee382fe4946.sql)
- `nexus_notifications_ttl` 0 5 * * 0 (20260711152903_d80535e0-3580-4d93-89e9-eb2c49be6a4d.sql)
- `nexus_partition_retention` 0 3 1 * * (20260901000000_cron_jobs_canonical.sql)
- `nexus_slow_queries` 0 6 * * * (20260901000000_cron_jobs_canonical.sql)
- `nexus_telemetry_cleanup` 0 4 * * * (20260711152903_d80535e0-3580-4d93-89e9-eb2c49be6a4d.sql)
- `persist-global-health-score-daily` 0 6 * * * (20260901000000_cron_jobs_canonical.sql)
- `predict-delays-every-30min` */30 * * * * → edge predict-delays-scheduled (20260901000000_cron_jobs_canonical.sql)
- `purge-webhook-inbound-failures-daily` 35 3 * * * (20261126120000_retencao_logs_contrato_e_webhook.sql)
- `refresh-dashboard-views-5m` */5 * * * * (20260901000000_cron_jobs_canonical.sql)
- `reindex-hot-indexes-weekly` 0 5 * * 0 (20260901000000_cron_jobs_canonical.sql)
- `rte-gateway-health-check` */15 * * * * → edge rodonaves-api (20260901000000_cron_jobs_canonical.sql)
- `rte-gateway-health-purge` 20 3 * * * (20260901000000_cron_jobs_canonical.sql)
- `rte-slo-daily-rollup` 20 0 * * * (20260901000000_cron_jobs_canonical.sql)
- `snapshot-query-baseline-daily` 30 4 * * * (20260901000000_cron_jobs_canonical.sql)
- `system-heartbeat-1m` * * * * * (20260901000000_cron_jobs_canonical.sql)

## Integrações externas
- SDKs: Sentry, Supabase, Upstash, i18next, react-query, zod
- hosts mais citados: api.resend.com, viacep.com.br, wa.me, api.ipify.org, generativelanguage.googleapis.com, loggi-flow-v2.vercel.app, rest.lalamove.com, s3.amazonaws.com, 01wapi.rte.com.br, api.openai.com, api.openweathermap.org, api.pwnedpasswords.com, api.transportadora.com, basemaps.cartocdn.com, bitrix24.com
- webhooks recebidos: carrier-webhook-receiver, evolution-whatsapp, health, health-check, lalamove-webhook, log-security-event, melhor-envio-api, nexus-webhook-receiver, predict-delays-scheduled, resend-email, rodonaves-webhook, webhook-status
- env de integração (só nomes): BITRIX24_WEBHOOK_URL, EVOLUTION_ALLOWED_INSTANCES, EVOLUTION_API_KEY, EVOLUTION_API_URL, EVOLUTION_INSTANCE_NAME, GOOGLE_API_KEY, INTERNAL_FN_SECRET, LALAMOVE_API_KEY, LALAMOVE_API_SECRET, MELHOR_ENVIO_TOKEN, OPENAI_API_KEY, OPENWEATHER_API_KEY, RESEND_API_KEY, SECURITY_SLACK_WEBHOOK_URL, UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL, VITE_GOOGLE_MAPS_API_KEY, VITE_N8N_WEBHOOK_URL, VITE_SENTRY_DSN

## Permissões / papéis
- papéis no código: user (6), admin (5), service_role (3), system (3), assistant (2), authenticated (2)
- enums de papel: app_role: admin|user
- guards: src/components/auth/ProtectedRoute.tsx · rotas protegidas: 57 · públicas: /*, /auth, /rastrear, /reset-password
- feature flags: nenhuma

## Alertas (baseline.json → alertas)
- rotas_sem_arquivo: 0
- componentes_ambiguos: 0
- menu_sem_destino: 6 — ex.: Atrasados -> atrasado, Com exceção -> excecao, Entregues -> entregue
- edges_orfas: 1 — ex.: ingest-biosync
- edges_chamadas_sem_pasta: 0
- tabelas_sem_rls: 0
- tabelas_rls_indeterminado: 12 — ex.: audit_logs_y2026m01, audit_logs_y2026m02, audit_logs_y2026m03
- tabelas_usadas_sem_definicao: 0
- tabelas_com_drift_migration_vs_types: 3 — ex.: business_rules_config, feature_flags, freight_integration_mappings
- rpcs_sem_definicao: 0
- componentes_orfaos: 2 — ex.: src/components/gamification/BadgeCard.tsx, src/components/gamification/GiftCard.tsx
- componentes_com_nome_duplicado: 8 — ex.: ConfirmProvider, DeleteButton, InlineConfirm
- scripts_orfaos: 0
- env_usadas_nao_declaradas: 2 — ex.: MODE, NODE_ENV
- ciclos_de_import: 3
- possiveis_segredos_no_codigo: 2 — ex.: tests/security/integrations-access.spec.ts:12, tests/security/rls-access.spec.ts:13

## Grafo de código (graphify)
- 10585 nós · 25107 arestas · 969 comunidades · grafo do commit `28503629`
- comunidades maiores: lucide-react (253), Envios.tsx (215), client.ts (197), ref_node_fs (176), db-observability/index.ts (175), react (158), App.tsx (150), sonner (122), ref_https (112), ref_node_url (106), useAuth (104), Dicionário de dados — Loggi Flow V2 (gerado do catálogo em 2026-08-31) (103)
- símbolos mais chamados: cn() (src/lib/utils.ts), useAuth() (src/hooks/auth/useAuth.tsx), apiGet() (supabase/functions/rodonaves-api/index.ts), q() (scripts/supabase_snapshot/snapshot.py), .write() (scripts/regras_negocio/test_generate.py), withFallback() (supabase/functions/rodonaves-api/fallback.ts), .publish() (scripts/regras_negocio/test_publish.py), .git() (scripts/regras_negocio/test_publish.py), .remote() (scripts/regras_negocio/test_publish.py), apiMutate() (supabase/functions/rodonaves-api/index.ts), ValidationError (supabase/functions/_shared/validate.ts), getAudioContext() (src/utils/celebrationSounds.ts)
- consulta local: `graphify query "<pergunta>"`, `graphify path "<A>" "<B>"`, `graphify explain "<X>"`

## Hotspots (arquivos mais alterados, 90 dias)
- docs/qa/05-PROGRESSO.md (154)
- AGENTS.md (17)
- docs/audit/2026-11-20_funcionalidades_nao_implementadas.md (13)
- docs/pendencias/_ordem.md (13)
- docs/qa/03-ACHADOS.md (13)
- supabase/schema-manifest.json (12)
- src/integrations/supabase/types.ts (11)
- docs/qa/07-AUDITORIA-BRANCHES.md (10)
- supabase/schema-catalog.json (10)
- docs/qa/08-AUDITORIA-COBERTURA-UI.md (9)
- scripts/db-audit/grants-baseline.json (8)
- supabase/functions/nexus-webhook-receiver/index.ts (8)
- supabase/functions/rodonaves-api/index.ts (8)
- scripts/automation.config.json (7)
- src/pages/Coletas.tsx (7)

## Workflows
- `aplicar-migration.yml` — Aplicar Migration (workflow_dispatch)
- `auto-update-pr-branch.yml` — Auto Update PR Branches (push, schedule, workflow_dispatch, workflow_run; cron 7,37 * * * *)
- `automation-local.yml` — Automação local (pull_request, push, workflow_dispatch)
- `branch-hygiene-audit.yml` — Branch Hygiene Audit (schedule, workflow_dispatch; cron 56 7 * * 1)
- `ci-nexus.yml` — CI Quality Gate Nexus (pull_request, push)
- `ci.yml` — CI/CD Pipeline (pull_request, push)
- `codeql.yml` — CodeQL (schedule, workflow_dispatch; cron 30 9 * * *)
- `contexto-ia.yml` — Contexto para agentes de IA (10 min) (push, schedule, workflow_dispatch; cron 7 * * * *)
- `dependency-review.yml` — Dependency Review (pull_request)
- `deploy-functions.yml` — Deploy Edge Functions (push, workflow_dispatch)
- `e2e.yml` — E2E (pull_request, workflow_dispatch)
- `inventario-estado-semanal.yml` — Inventário do estado real (semanal) (schedule, workflow_dispatch; cron 23 10 * * 1)
- `notifica-falha-main.yml` — Notifica falha na main (workflow_run)
- `scripts-tests.yml` — Scripts Tests (pull_request, push, workflow_dispatch)
- `security.yml` — Security Scan (pull_request, push, schedule; cron 0 0 * * 0)
- `settings-guard.yml` — Settings Guard (schedule, workflow_dispatch; cron 15 7 * * *)
- `sync-internal-secret.yml` — Sync Internal Secret (workflow_dispatch)
- `types-sync.yml` — types-sync (push, schedule, workflow_dispatch; cron 49 5 * * 1)

## Scripts npm
- `maintenance:doctor`: `sh scripts/maintenance/run.sh doctor --root .`
- `maintenance:check`: `sh scripts/maintenance/run.sh check --root . --ref origin/main`
- `maintenance:heal`: `sh scripts/maintenance/run.sh heal --root . --ref origin/main`
- `test:maintenance`: `node --test scripts/maintenance/maintenance.unit.mjs`
- `dev`: `vite`
- `prebuild`: `node scripts/validate-csp.mjs`
- `build`: `vite build`
- `build:dev`: `vite build --mode development`
- `validate:csp`: `node scripts/validate-csp.mjs`
- `validate:dedupe-keys`: `node scripts/ci/check-dedupe-keys.mjs`
- `validate:no-console`: `node scripts/validate-no-console.mjs`
- `validate:query-limits`: `node scripts/ci/validate-query-limits.mjs`
- `validate:soft-delete`: `node scripts/ci/check-soft-delete.mjs`
- `validate:agents-facts`: `node scripts/ci/check-agents-facts.mjs`
- `validate:doc-paths`: `node scripts/ci/check-doc-paths.mjs`
- `validate:root-files`: `node scripts/ci/check-root-files.mjs`
- `test:rls`: `vitest run tests/security/rls-access.spec.ts tests/security/integrations-access.spec.ts`
- `test:security`: `vitest run tests/security/`
- `lint`: `eslint .`
- `lint:budget`: `node scripts/check-warning-budget.mjs`
- `lint:budget:ratchet`: `node scripts/ratchet-warning-budget.mjs`
- `quality:report`: `node scripts/generate-quality-report.mjs`
- `graph:setup`: `bash scripts/graphify/setup.sh`
- `graph:update`: `graphify update .`
- `preview`: `vite preview`
- `test`: `vitest`
- `test:ui`: `vitest --ui`
- `test:coverage`: `vitest --coverage`
- `test:watch`: `vitest --watch`
- `test:e2e`: `playwright test`
- `test:fuzz`: `vitest tests/integration/fuzzing.spec.ts`
- `typecheck`: `tsc --noEmit`
- `check-circular`: `madge --circular src`
- `security-scan`: `node scripts/audit-gate.mjs`
- `seed`: `tsx scripts/seed-database.ts`
- `prepare`: `husky`
- `automation:doctor`: `node scripts/automation.mjs doctor`
- `automation:test`: `node scripts/automation.mjs test`
- `automation:check`: `node scripts/automation.mjs check --ref HEAD`
- `automation:heal`: `node scripts/automation.mjs heal --ref origin/main`
- `automation:nightly`: `node scripts/automation.mjs nightly --ref origin/main`
- `automation:graph`: `node scripts/automation.mjs graph`
- `automation:status`: `node scripts/automation.mjs graph status`
- `automation:install-hooks`: `node scripts/automation.mjs install-hooks`
- `automation:uninstall-hooks`: `node scripts/automation.mjs uninstall-hooks`

## Documentos (raiz e docs/)
- `.github/pull_request_template.md` — Resumo (10 linhas)
- `AGENTS.md` — AGENTS.md — Loggi Flow V2 (149 linhas)
- `CHANGELOG.md` — Changelog (118 linhas)
- `CLAUDE.md` (2 linhas)
- `CONTRIBUTING.md` — Contribuindo para o Loggi-Flow (42 linhas)
- `DOCUMENTATION.md` — 📋 Documentação Técnica - Loggi-Flow (775 linhas)
- `ESTADO_ATUAL.md` — ESTADO ATUAL DO SISTEMA — LogiFlow / loggi-flow-v2 (539 linhas)
- `ESTADO_ATUAL_EVIDENCIAS.md` — EVIDÊNCIAS — Auditoria de Estado do LogiFlow (604 linhas)
- `README.md` — 🚚 Loggi-Flow (120 linhas)
- `TEMPLATE_STRUCTURE.md` — 🚀 Template de Estrutura - Guia de Setup (1466 linhas)
- `docs/ANALISE_API_RODONAVES.md` — ANÁLISE TÉCNICA DEFINITIVA — API RODONAVES TRANSPORTES (229 linhas)
- `docs/ARCHITECTURE.md` — 🏗️ Arquitetura do Loggi-Flow (181 linhas)
- `docs/ARCHITECTURE_C4.md` — C4 Architecture Model - LogiFlow (63 linhas)
- `docs/AUDITORIA_BACKEND_SENIOR_2026.md` — 🔍 Auditoria Sênior de Back-End — Loggi-Flow (245 linhas)
- `docs/AUTOMACAO_LOCAL.md` — Automação local — Loggi_Flow_V2 (158 linhas)
- `docs/DISASTER_RECOVERY.md` — Disaster Recovery Runbook (15 linhas)
- `docs/ER_DIAGRAM.md` — Entity Relationship Diagram - LogiFlow (61 linhas)
- `docs/HOOKS_COMPONENTS_API.md` — Documentação de Hooks e Componentes Reutilizáveis (640 linhas)
- `docs/INCIDENT_PLAYBOOK.md` — 🛠️ LogiFlow Incident Playbook (33 linhas)
- `docs/INCIDENT_RESPONSE.md` — 🚑 Plano de Resposta a Incidentes (IRP) (25 linhas)
- `docs/INTEGRACAO_CONFIG.md` — Configuração de Integrações - Loggi Flow (193 linhas)
- `docs/INVENTARIO_FUNCIONALIDADES.md` — 🛡️ INVENTÁRIO DE FUNCIONALIDADES LOGIFLOW — 10/10 (132 linhas)
- `docs/LGPD_COMPLIANCE.md` — 🛡️ LGPD COMPLIANCE & PRIVACY POLICY (18 linhas)
- `docs/MELHORIAS.md` — ✅ MELHORIAS IMPLEMENTADAS - LOGGI-FLOW v4.0 (180 linhas)
- `docs/MIGRATION-GUIDE.md` — 🚀 Guia de Migração Mock → Produção (139 linhas)
- `docs/ONBOARDING.md` — Onboarding do Desenvolvedor (LogiFlow 10/10) (15 linhas)
- `docs/PERFEICAO_10_10.md` — CERTIFICADO DE PERFEIÇÃO 10/10 — LOGIFLOW (54 linhas)
- `docs/PLANO_BRASPRESS_MULTITRANSPORTADORAS_200_ETAPAS.md` — Plano Braspress + Multitransportadora — 200 etapas (425 linhas)
- `docs/PLANO_FRONTEND_CONTRATOS_190_ETAPAS.md` — Plano Front‑End Sênior + Contratos de API — 190 etapas (474 linhas)
- `docs/PLANO_GOOGLE_MAPS_150_ETAPAS.md` — Plano Google Maps Platform — 150 etapas (1380 linhas)
- `docs/PLANO_MELHORIAS_2026.md` — 📋 PLANO EXAUSTIVO DE MELHORIAS — LogiFlow 2026 (120 linhas)
- `docs/PLANO_TRANSPORTADORAS_200_ETAPAS.md` — Plano Transportadoras — 200 etapas (Rodonaves a fundo + multitransportadora) (1785 linhas)
- `docs/PLANO_UX_NAVEGACAO_200_ETAPAS.md` — Plano de UX de navegação — 200 etapas (508 linhas)
- `docs/POSTMORTEM_TEMPLATE.md` — 📓 Post-Mortem de Incidentes (31 linhas)
- `docs/README-CRUD.md` — 📚 Documentação CRUD - Loggi-Flow (120 linhas)
- `docs/RELATORIO_PERFEICAO_FINAL.md` — 🏆 RELATÓRIO DE PERFEIÇÃO 10/10 — LogiFlow (49 linhas)
- `docs/RUNBOOK_BACKUP.md` — 📑 Runbook: Backup & Disaster Recovery - LogiFlow (46 linhas)
- `docs/RUNBOOK_DB_PERFORMANCE.md` — Runbook — Investigação de Performance de Banco (55 linhas)
- `docs/SECURITY_AUDIT_REPORT.md` — 🕵️ SECURITY PEN-TEST REPORT (SELF-AUDIT) (15 linhas)
- `docs/SLO.md` — 📈 Service Level Objectives (SLOs) — LogiFlow (40 linhas)
- `docs/SOFT_DELETE_POLICY.md` — Política de Soft Delete — LogiFlow (36 linhas)
- `docs/SRE_HANDBOOK.md` — 🚒 LOGIFLOW SRE & ON-CALL HANDBOOK (24 linhas)
- `docs/auditoria-recuperacao-branches.md` (336 linhas)
- `docs/prod-readiness.md` — Prod Readiness — Loggi_Flow_V2 (89 linhas)
- subpastas de docs/: docs/pendencias (165), docs/adr (20), docs/qa (9), docs/agentes (8), docs/audit (3), docs/contexto (2), docs/data (1), docs/seguranca (1)
- CHANGELOG topo: [1.1.0] - 2026-09-02

## Últimos commits
- 2026-11-26 `2850362` docs: reaudita as 49 PRs fechadas e as 16 branches arquivo a arquivo (#555)
- 2026-11-26 `169ad92` fix: crash de tela usa a RPC que grava tambem sem sessao (#554)
- 2026-11-26 `e07c1b5` chore(db): sincronizar artefatos com o banco [auto] (#553)
- 2026-11-26 `23cd682` feat: crash de tela publica passa a ser gravado por RPC liberada para anonimo (#552)
- 2026-11-26 `18c288a` chore: fecha a decisao 5 do censo mantendo o multi-tenant dormente (#551)
- 2026-11-26 `db8018b` chore(db): sincronizar artefatos com o banco [auto] (#545)
- 2026-11-26 `a2c24e8` feat: crash de render vira registro em telemetry_logs sem depender de DSN (#550)
- 2026-11-26 `93aaf77` chore: remove xp_for_level sem chamador e fecha o censo de funcoes (#549)
- 2026-11-26 `1bbacc0` chore: fecha o censo do doc 08 com retencao de logs medida e cron conferido (#548)
- 2026-11-26 `ccea0b6` chore: remove camada fast-metrics sem leitor e system_health_check (#547)
- 2026-11-26 `aaeb84c` feat: chat de IA passa a persistir o historico em ai_chat_messages (#546)
- 2026-11-26 `b0323be` chore: remove 7 tabelas mortas sem consumidor (fecha a lista DECIDIR do doc 08) (#544)
- 2026-11-26 `3876814` docs: etapa 283 fecha com o job de E2E verde na main (#543)
- 2026-11-26 `ab6c510` infra: roda as suites de tests/e2e na CI (etapa 283) (#524)
- 2026-11-26 `b8c7f39` docs: corrige o censo de cobertura - business_rules_config voltou a ter efeito (#542)

## Arquivos deste diretório
- `docs/contexto/codigo/rotas.json`
- `docs/contexto/codigo/modulos.json`
- `docs/contexto/codigo/componentes.json`
- `docs/contexto/codigo/hooks.json`
- `docs/contexto/codigo/edge-functions.json`
- `docs/contexto/codigo/banco.json`
- `docs/contexto/codigo/ferramentas.json`
- `docs/contexto/codigo/scripts.json`
- `docs/contexto/codigo/testes.json`
- `docs/contexto/codigo/logica.json`
- `docs/contexto/codigo/grafo.json`
- `docs/contexto/codigo/grafo-arestas.json`
- `docs/contexto/codigo/convencoes.json`
- `docs/contexto/codigo/grafo-graphify.json`
- `docs/contexto/codigo/baseline.json`
- `docs/contexto/codigo/manifest.json` (commit, data, hashes, erros — único arquivo com data/hora)

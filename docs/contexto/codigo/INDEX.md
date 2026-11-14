# Contexto do projeto para agentes de IA

GERADO AUTOMATICAMENTE por scripts/ai-context/gerar.mjs — não editar à mão; será sobrescrito.
Publicado pelo workflow .github/workflows/contexto.yml em docs/contexto/codigo/ da branch `contexto`. Leia: git fetch origin contexto && git show origin/contexto:docs/contexto/00-INDEX.md Gere local com `node scripts/ai-context/gerar.mjs`. Commit-base: `fee186d32896a106a2fc2220d157a4786317b7da` (2026-11-14T09:02:27-03:00).

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
- linguagens: TypeScript (776), SQL (257), Markdown (83), JavaScript (80), JSON (29), YAML (20), Shell (9), Python (8)
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
- deploy: n/d
- monorepo: n/d
- pastas_fonte: src

## Números
| item | qtd |
|---|---|
| arquivos_total | 1280 |
| arquivos_codigo | 863 |
| linhas_codigo | 165721 |
| rotas | 61 |
| rotas_http_backend | 0 |
| vistas_por_id | 0 |
| itens_menu | 77 |
| modulos | 74 |
| componentes | 380 |
| hooks | 175 |
| edge_functions | 43 |
| tabelas | 144 |
| migrations | 244 |
| cron_jobs | 28 |
| testes | 123 |
| workflows | 16 |
| scripts | 62 |
| docs_md | 83 |

## Onde ficam as coisas
- telas: src/pages (61)
- componentes: src/components (256), src/pages (77), src/features (41)
- hooks: src/hooks (119), src/features (41), src/components (14)
- servicos_logica: src/lib (26), src/utils (6), src/services (5)
- testes: co-localizado (*.test) (67), outro (45), tests/ (11)
- edge_functions: supabase/functions
- migrations: supabase/migrations
- scripts: scripts/db-audit (15), scripts/ci (10), scripts/audit (5)
- docs: docs (28), (raiz) (9), .github (1)
- nomenclatura: {"componentes":"PascalCase (86%)","hooks":"use + PascalCase","servicos":"camelCase (93%)","edge_functions":"kebab-case (98%)","tabelas":"snake_case (89%)"}
- instruções para agentes no repo: AGENTS.md, CLAUDE.md

## Módulos (menu → domínio)
| módulo | itens de menu | telas/rotas | arquivos | hooks locais | edges | tabelas |
|---|---|---|---|---|---|---|
| components/common | 0 | 0 | 45 | 16 | 2 | 11 |
| components/dashboard | 0 | 0 | 16 | 27 | 2 | 21 |
| components/freight | 0 | 0 | 18 | 96 | 19 | 53 |
| components/layout | 0 | 0 | 7 | 21 | 3 | 17 |
| components/map | 0 | 0 | 6 | 6 | 1 | 1 |
| components/melhorenvio | 0 | 0 | 18 | 6 | 1 | 3 |
| components/notifications | 0 | 0 | 5 | 6 | 0 | 6 |
| components/onboarding | 0 | 0 | 6 | 4 | 0 | 7 |
| components/predictions | 0 | 0 | 13 | 14 | 2 | 13 |
| components/rodonaves | 0 | 0 | 17 | 6 | 1 | 6 |
| components/security | 0 | 0 | 24 | 12 | 3 | 17 |
| components/transportadoras | 0 | 0 | 6 | 1 | 1 | 4 |
| components/ui | 0 | 0 | 55 | 4 | 0 | 0 |
| features/db-observability | 0 | 0 | 80 | 47 | 0 | 6 |
| hooks/analytics | 0 | 0 | 11 | 12 | 1 | 13 |
| hooks/auth | 0 | 0 | 8 | 8 | 1 | 8 |
| hooks/common | 0 | 0 | 19 | 22 | 0 | 10 |
| hooks/data | 0 | 0 | 7 | 6 | 0 | 11 |
| hooks/integrations | 0 | 0 | 5 | 3 | 5 | 5 |
| hooks/logistics | 0 | 0 | 39 | 40 | 8 | 35 |
| hooks/notifications | 0 | 0 | 6 | 7 | 1 | 7 |
| hooks/security | 0 | 0 | 7 | 10 | 7 | 8 |
| hooks/ui | 0 | 0 | 6 | 9 | 0 | 7 |
| lib | 0 | 0 | 11 | 0 | 0 | 0 |
| lib/predictions | 0 | 0 | 6 | 0 | 0 | 0 |
| lib/rodonaves | 0 | 0 | 8 | 0 | 0 | 0 |
| pages | 75 | 59 | 59 | 125 | 30 | 81 |
| pages/admin | 1 | 2 | 2 | 67 | 3 | 20 |
| pages/auth | 0 | 0 | 5 | 2 | 3 | 1 |
| utils | 0 | 0 | 6 | 0 | 1 | 3 |

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
- `ai-logistics-assistant` — tabelas: entregas, ocorrencias, transportadoras; chamada por 1 arquivo(s) do front
- `bitrix24-integration` — tabelas: audit_logs; chamada por 3 arquivo(s) do front
- `carrier-webhook-receiver` (verify_jwt=false) — tabelas: automation_audit_logs; chamada por 0 arquivo(s) do front
- `check-password-breach` — tabelas: -; chamada por 1 arquivo(s) do front
- `check-rate-limit` — tabelas: rate_limit_logs, security_events; chamada por 1 arquivo(s) do front
- `db-health-snapshot` — tabelas: db_health_snapshots; chamada por 0 arquivo(s) do front, por SQL/cron
- `db-health-weekly-report` — tabelas: db_slo_daily, profiles, user_roles; chamada por 0 arquivo(s) do front, por SQL/cron
- `db-regression-monitor` — tabelas: feature_flags, nexus_tactical_logs, notifications, user_roles; chamada por 0 arquivo(s) do front, por SQL/cron
- `evolution-whatsapp` (verify_jwt=false) — tabelas: -; chamada por 1 arquivo(s) do front
- `execute-protocol` — tabelas: -; chamada por 1 arquivo(s) do front
- `external-db-bridge` — tabelas: query_telemetry; chamada por 1 arquivo(s) do front
- `geocode-address` — tabelas: -; chamada por 2 arquivo(s) do front
- `get-mapbox-token` — tabelas: -; chamada por 2 arquivo(s) do front
- `get-weather-data` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `health` (verify_jwt=false) — tabelas: profiles; chamada por 0 arquivo(s) do front
- `health-check` (verify_jwt=false) — tabelas: profiles; chamada por 1 arquivo(s) do front
- `ingest-biosync` — tabelas: bio_sync_alert_rules, bio_sync_telemetry, nexus_tactical_logs; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `lalamove-api` — tabelas: -; chamada por 1 arquivo(s) do front
- `lalamove-tracking` — tabelas: -; chamada por 2 arquivo(s) do front
- `lalamove-webhook` (verify_jwt=false) — tabelas: coletas, rastreamento_alertas, rastreamento_historico, webhook_events_processed; chamada por 0 arquivo(s) do front
- `lgpd-erase-user` — tabelas: audit_logs, entregas, profiles, user_roles; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `log-login-attempt` — tabelas: login_attempts; chamada por 1 arquivo(s) do front
- `log-security-event` (verify_jwt=false) — tabelas: security_events; chamada por 1 arquivo(s) do front
- `melhor-envio-api` (verify_jwt=false) — tabelas: -; chamada por 2 arquivo(s) do front
- `new-device-alert` — tabelas: security_events; chamada por 1 arquivo(s) do front
- `nexus-auto-healing` — tabelas: coletas, entregas, system_heartbeat, system_integrity_logs; chamada por 1 arquivo(s) do front
- `nexus-webhook-receiver` (verify_jwt=false) — tabelas: cotacoes_multicanal, transportadoras; chamada por 1 arquivo(s) do front
- `normalize-freight-response` — tabelas: cotacoes_multicanal, transportadoras, user_notification_preferences; chamada por 2 arquivo(s) do front
- `ocr-receipt-processor` — tabelas: delivery_receipt_audit, entregas; chamada por 1 arquivo(s) do front
- `predict-delays` — tabelas: ai_delay_predictions, coletas, delay_predictions_history, entregas, ocorrencias, user_notification_preferences; chamada por 1 arquivo(s) do front, por SQL/cron
- `predict-delays-scheduled` (verify_jwt=false) — tabelas: delay_predictions_history, notifications, user_roles; chamada por 0 arquivo(s) do front, por SQL/cron
- `resend-email` (verify_jwt=false) — tabelas: -; chamada por 0 arquivo(s) do front
- `rodonaves-api` — tabelas: entregas, ocorrencias, rte_gateway_health; chamada por 4 arquivo(s) do front, por SQL/cron
- `rodonaves-webhook` (verify_jwt=false) — tabelas: entregas, ocorrencias, webhook_events_processed; chamada por 1 arquivo(s) do front
- `scheduled-reports` — tabelas: coletas, entregas, scheduled_reports; chamada por 1 arquivo(s) do front
- `secure-store` — tabelas: -; chamada por 0 arquivo(s) do front — **ÓRFÃ**
- `send-password-reset` — tabelas: password_reset_requests, user_roles; chamada por 1 arquivo(s) do front
- `smart-carrier-selection` — tabelas: entregas, freight_decisions, freight_selection_rules, tabelas_frete; chamada por 1 arquivo(s) do front
- `validate-login` — tabelas: geo_access_rules, geo_blocked_attempts, ip_access_rules, login_attempts; chamada por 1 arquivo(s) do front
- `webhook-status` (verify_jwt=false) — tabelas: client_webhooks, webhook_deliveries; chamada por 1 arquivo(s) do front
- `whatsapp-notification` — tabelas: audit_logs, coletas, entregas; chamada por 1 arquivo(s) do front

## Cron jobs (pg_cron / vercel)
- `accuracy-meta-monitor-daily` 15 8 * * * → edge accuracy-meta-monitor (20260901000000_cron_jobs_canonical.sql)
- `accuracy-weekly-digest-monday` 0 9 * * 1 → edge accuracy-weekly-digest (20260901000000_cron_jobs_canonical.sql)
- `auto-revert-ineffective-indexes-daily` 30 4 * * * (20260901000000_cron_jobs_canonical.sql)
- `check-health-score-regression-hourly` 15 * * * * (20260901000000_cron_jobs_canonical.sql)
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
- `refresh-dashboard-views-5m` */5 * * * * (20260901000000_cron_jobs_canonical.sql)
- `reindex-hot-indexes-weekly` 0 5 * * 0 (20260901000000_cron_jobs_canonical.sql)
- `rte-gateway-health-check` */15 * * * * → edge rodonaves-api (20260901000000_cron_jobs_canonical.sql)
- `rte-gateway-health-purge` 20 3 * * * (20260901000000_cron_jobs_canonical.sql)
- `rte-slo-daily-rollup` 20 0 * * * (20260901000000_cron_jobs_canonical.sql)
- `snapshot-query-baseline-daily` 30 4 * * * (20260901000000_cron_jobs_canonical.sql)
- `system-heartbeat-1m` * * * * * (20260901000000_cron_jobs_canonical.sql)

## Integrações externas
- SDKs: Sentry, Supabase, Upstash, i18next, react-query, zod
- hosts mais citados: api.resend.com, api.ipify.org, viacep.com.br, wa.me, api.mapbox.com, generativelanguage.googleapis.com, rest.lalamove.com, 01wapi.rte.com.br, api.a-ticket.com.br, api.loggi-flow.com, api.openai.com, api.openweathermap.org, api.pwnedpasswords.com, api.transportadora.com, bitrix24.com
- webhooks recebidos: carrier-webhook-receiver, evolution-whatsapp, health, health-check, lalamove-webhook, log-security-event, melhor-envio-api, nexus-webhook-receiver, predict-delays-scheduled, resend-email, rodonaves-webhook, webhook-status
- env de integração (só nomes): ATICKET_API_KEY, BITRIX24_WEBHOOK_URL, EVOLUTION_API_KEY, EVOLUTION_API_URL, GOOGLE_API_KEY, INTERNAL_FN_SECRET, LALAMOVE_API_KEY, LALAMOVE_API_SECRET, MAPBOX_PUBLIC_TOKEN, MELHOR_ENVIO_TOKEN, NEXUS_WEBHOOK_SECRET, OPENAI_API_KEY, OPENWEATHER_API_KEY, RESEND_API_KEY, SECURITY_SLACK_WEBHOOK_URL, UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL, VITE_BITRIX24_WEBHOOK, VITE_GOOGLE_MAPS_API_KEY, VITE_MAPBOX_TOKEN, VITE_N8N_WEBHOOK_URL, VITE_SENTRY_DSN

## Permissões / papéis
- papéis no código: admin (5), user (4), service_role (3), system (3), authenticated (2), CEO (1), Coordenadora (1), assistant (1)
- enums de papel: app_role: admin|user
- guards: src/components/auth/ProtectedRoute.tsx · rotas protegidas: 57 · públicas: /*, /auth, /rastrear, /reset-password
- feature flags: nenhuma

## Alertas (baseline.json → alertas)
- rotas_sem_arquivo: 0
- componentes_ambiguos: 0
- menu_sem_destino: 1 — ex.: Integrações -> /gestao-melhor-envio
- edges_orfas: 4 — ex.: get-weather-data, ingest-biosync, lgpd-erase-user
- edges_chamadas_sem_pasta: 0
- tabelas_sem_rls: 12 — ex.: audit_logs_y2026m01, audit_logs_y2026m02, audit_logs_y2026m03
- tabelas_usadas_sem_definicao: 1 — ex.: integracoes_bitrix
- tabelas_com_drift_migration_vs_types: 5 — ex.: business_rules_config, feature_flags, freight_integration_mappings
- rpcs_sem_definicao: 0
- componentes_orfaos: 2 — ex.: src/components/common/TiltCard.tsx, src/components/gamification/GamificationPanel.tsx
- componentes_com_nome_duplicado: 8 — ex.: ConfirmProvider, DeleteButton, InlineConfirm
- scripts_orfaos: 0
- env_usadas_nao_declaradas: 4 — ex.: DEV, MODE, NODE_ENV
- ciclos_de_import: 3
- possiveis_segredos_no_codigo: 3 — ex.: src/components/dashboard/LogisticsMapWidget.tsx:73, tests/security/integrations-access.spec.ts:12, tests/security/rls-access.spec.ts:13

## Grafo de código (graphify)
- 8009 nós · 20274 arestas · 686 comunidades · grafo do commit `fee186d3`
- comunidades maiores: cn (213), lucide-react (207), sonner (190), button.tsx (170), ref_node_path (142), react (141), date-fns (130), db-observability/index.ts (130), @tanstack/react-query (121), Dicionário de dados — Loggi Flow V2 (gerado do catálogo em 2026-08-31) (103), client.ts (97), gerar.mjs (81)
- símbolos mais chamados: cn() (src/lib/utils.ts), useAuth() (src/hooks/auth/useAuth.tsx), apiGet() (supabase/functions/rodonaves-api/index.ts), q() (scripts/supabase_snapshot/snapshot.py), .write() (scripts/regras_negocio/test_generate.py), .publish() (scripts/regras_negocio/test_publish.py), .git() (scripts/regras_negocio/test_publish.py), .remote() (scripts/regras_negocio/test_publish.py), apiMutate() (supabase/functions/rodonaves-api/index.ts), getAudioContext() (src/utils/celebrationSounds.ts), .collect() (scripts/supabase_snapshot/test_snapshot.py), playNote() (src/utils/celebrationSounds.ts)
- consulta local: `graphify query "<pergunta>"`, `graphify path "<A>" "<B>"`, `graphify explain "<X>"`

## Hotspots (arquivos mais alterados, 90 dias)
- package-lock.json (40)
- package.json (40)
- index.html (9)
- src/hooks/gamification/useGamification.ts (9)
- AGENTS.md (5)
- scripts/validate-csp.mjs (5)
- supabase/config.toml (5)
- .github/workflows/ci.yml (4)
- .github/workflows/contexto-ia.yml (4)
- .github/workflows/deploy-functions.yml (4)
- .github/workflows/types-sync.yml (4)
- ESTADO_ATUAL.md (4)
- ESTADO_ATUAL_EVIDENCIAS.md (4)
- scripts/audit/manifest_detail.sql (4)
- scripts/check-warning-budget.mjs (4)

## Workflows
- `auto-update-pr-branch.yml` — Auto Update PR Branches (push, schedule, workflow_dispatch, workflow_run; cron 7,37 * * * *)
- `automation-local.yml` — Automação local (pull_request, push, workflow_dispatch)
- `branch-hygiene-audit.yml` — Branch Hygiene Audit (schedule, workflow_dispatch; cron 56 7 * * 1)
- `ci-nexus.yml` — CI Quality Gate Nexus (pull_request, push)
- `ci.yml` — CI/CD Pipeline (pull_request, push)
- `codeql.yml` — CodeQL (schedule, workflow_dispatch; cron 30 9 * * *)
- `contexto-ia.yml` — Contexto para agentes de IA (10 min) (push, schedule, workflow_dispatch; cron 7-59/10 * * * *)
- `deploy-functions.yml` — Deploy Edge Functions (workflow_dispatch)
- `e2e.yml` — E2E (manual) (workflow_dispatch)
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
- `validate:no-console`: `node scripts/validate-no-console.mjs`
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
- `AGENTS.md` — AGENTS.md — Loggi Flow V2 (129 linhas)
- `CHANGELOG.md` — Changelog (118 linhas)
- `CLAUDE.md` (2 linhas)
- `CONTRIBUTING.md` — Contribuindo para o Loggi-Flow (42 linhas)
- `DOCUMENTATION.md` — 📋 Documentação Técnica - Loggi-Flow (740 linhas)
- `ESTADO_ATUAL.md` — ESTADO ATUAL DO SISTEMA — LogiFlow / loggi-flow-v2 (523 linhas)
- `ESTADO_ATUAL_EVIDENCIAS.md` — EVIDÊNCIAS — Auditoria de Estado do LogiFlow (596 linhas)
- `README.md` — 🚚 Loggi-Flow (120 linhas)
- `TEMPLATE_STRUCTURE.md` — 🚀 Template de Estrutura - Guia de Setup (1422 linhas)
- `docs/ANALISE_API_RODONAVES.md` — ANÁLISE TÉCNICA DEFINITIVA — API RODONAVES TRANSPORTES (229 linhas)
- `docs/ARCHITECTURE.md` — 🏗️ Arquitetura do Loggi-Flow (181 linhas)
- `docs/ARCHITECTURE_C4.md` — C4 Architecture Model - LogiFlow (63 linhas)
- `docs/AUDITORIA_BACKEND_SENIOR_2026.md` — 🔍 Auditoria Sênior de Back-End — Loggi-Flow (245 linhas)
- `docs/AUTOMACAO_LOCAL.md` — Automação local — Loggi_Flow_V2 (159 linhas)
- `docs/DISASTER_RECOVERY.md` — Disaster Recovery Runbook (15 linhas)
- `docs/ER_DIAGRAM.md` — Entity Relationship Diagram - LogiFlow (61 linhas)
- `docs/HOOKS_COMPONENTS_API.md` — Documentação de Hooks e Componentes Reutilizáveis (640 linhas)
- `docs/INCIDENT_PLAYBOOK.md` — 🛠️ LogiFlow Incident Playbook (33 linhas)
- `docs/INCIDENT_RESPONSE.md` — 🚑 Plano de Resposta a Incidentes (IRP) (25 linhas)
- `docs/INTEGRACAO_CONFIG.md` — Configuração de Integrações - Loggi Flow (193 linhas)
- `docs/INVENTARIO_FUNCIONALIDADES.md` — 🛡️ INVENTÁRIO DE FUNCIONALIDADES LOGIFLOW — 10/10 (123 linhas)
- `docs/LGPD_COMPLIANCE.md` — 🛡️ LGPD COMPLIANCE & PRIVACY POLICY (18 linhas)
- `docs/MELHORIAS.md` — ✅ MELHORIAS IMPLEMENTADAS - LOGGI-FLOW v4.0 (162 linhas)
- `docs/MIGRATION-GUIDE.md` — 🚀 Guia de Migração Mock → Produção (134 linhas)
- `docs/ONBOARDING.md` — Onboarding do Desenvolvedor (LogiFlow 10/10) (15 linhas)
- `docs/PERFEICAO_10_10.md` — CERTIFICADO DE PERFEIÇÃO 10/10 — LOGIFLOW (45 linhas)
- `docs/PLANO_MELHORIAS_2026.md` — 📋 PLANO EXAUSTIVO DE MELHORIAS — LogiFlow 2026 (105 linhas)
- `docs/POSTMORTEM_TEMPLATE.md` — 📓 Post-Mortem de Incidentes (31 linhas)
- `docs/README-CRUD.md` — 📚 Documentação CRUD - Loggi-Flow (120 linhas)
- `docs/RELATORIO_PERFEICAO_FINAL.md` — 🏆 RELATÓRIO DE PERFEIÇÃO 10/10 — LogiFlow (38 linhas)
- `docs/RUNBOOK_BACKUP.md` — 📑 Runbook: Backup & Disaster Recovery - LogiFlow (46 linhas)
- `docs/RUNBOOK_DB_PERFORMANCE.md` — Runbook — Investigação de Performance de Banco (55 linhas)
- `docs/SECURITY_AUDIT_REPORT.md` — 🕵️ SECURITY PEN-TEST REPORT (SELF-AUDIT) (15 linhas)
- `docs/SLO.md` — 📈 Service Level Objectives (SLOs) — LogiFlow (40 linhas)
- `docs/SOFT_DELETE_POLICY.md` — Política de Soft Delete — LogiFlow (30 linhas)
- `docs/SRE_HANDBOOK.md` — 🚒 LOGIFLOW SRE & ON-CALL HANDBOOK (24 linhas)
- `docs/prod-readiness.md` — Prod Readiness — Loggi_Flow_V2 (67 linhas)
- subpastas de docs/: docs/adr (20), docs/agentes (7), docs/audit (2), docs/contexto (2), docs/data (1)
- CHANGELOG topo: [1.1.0] - 2026-09-02

## Últimos commits
- 2026-11-14 `fee186d3` docs: prod-readiness — registra Data Integrity BLOQUEADO e status reais (#151)
- 2026-11-13 `a49bf31e` docs: fecha prod-readiness com inventario e evidencia (#147)
- 2026-11-13 `db887499` docs: registra quirk do cache do GET /secrets da Management API (RESEND_API_KEY) (#146)
- 2026-11-13 `926f5496` infra: adiciona --yes no deploy de edge functions (#144)
- 2026-11-13 `bbb9bbc9` fix: corrige caminho import_map no config.toml para destravar deploy em lote (#145)
- 2026-11-13 `8ea891f4` fix: usa dominio verificado no remetente dos emails (promobrindes.com.br) (#142)
- 2026-11-12 `30eecc9a` chore(db): sincronizar artefatos derivados do banco (#141)
- 2026-11-12 `e0982180` fix: adiciona --yes ao supabase secrets set para CI sem TTY (#140)
- 2026-11-12 `0c0d48cc` chore(deps): bump actions/download-artifact from 7 to 8 (#128)
- 2026-11-12 `5f05479d` chore(deps): bump github/codeql-action/init from 4.39.1 to 4.39.3 (#127)
- 2026-11-12 `2e9137fa` chore(deps): bump actions/cache from 4 to 6 (#126)
- 2026-11-12 `3d4fd588` chore(deps): bump peter-evans/create-pull-request from 8.1.1 to 8.1.2 (#125)
- 2026-11-12 `02901100` chore(deps): bump github/codeql-action/analyze from 4.39.1 to 4.39.3 (#124)
- 2026-11-12 `3fad225d` style: aplica correcoes locais verificadas (#136)
- 2026-11-11 `60b8d213` feat(ci): workflow ressincroniza INTERNAL_FN_SECRET do vault nas functions (#138)

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

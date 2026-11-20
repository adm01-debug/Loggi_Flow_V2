# Auditoria: funcionalidades planejadas × implementadas — Loggi Flow V2 — 2026-11-20

> **Escopo:** tudo que a documentação do repositório (`docs/`, `docs/adr/`, `docs/agentes/`, `README.md`,
> `DOCUMENTATION.md`, `TEMPLATE_STRUCTURE.md`, `CHANGELOG.md`, `ESTADO_ATUAL*.md`, `AGENTS.md`,
> `docs/api/openapi.yaml`, `docs/data/dicionario.md`) declara como existente, planejado ou concluído, cruzado
> com o código em `main` @ `3a9fa6a` (2026-11-19): `src/`, `supabase/functions/`, `supabase/migrations/`,
> `scripts/`, `.github/workflows/`, `tests/`.
>
> **Método:** leitura dos 67 arquivos de `docs/` + raiz; inventário de rotas, hooks, componentes, edge
> functions, crons e tabelas; cruzamento sistemático docs→código (todo caminho, hook, componente, tabela,
> RPC e function citado) e código→banco (todo `.from()`, `.rpc()`, `functions.invoke()` contra
> `src/integrations/supabase/types.ts`, que é gerado do banco ao vivo pelo `types-sync.yml`). Três varreduras
> paralelas (páginas/componentes, edge functions, auditorias anteriores) e, no fim, **verificação adversarial
> independente de cada achado** (um agente tentou refutar cada item lendo o código). Resultado da
> verificação: 110 achados iniciais → 77 confirmados, 31 confirmados com correção de detalhe (incorporadas
> abaixo), 2 refutados (removidos). Mais 53 lacunas encontradas por dois críticos de completude, também
> verificadas (seção 16 traz as que não sobreviveram).
>
> **Limite:** o MCP do banco oficial (`jvfhclubfpxrtrrazrgr`) não estava carregado nesta sessão. Tudo que
> depende do banco ao vivo (grants atuais, publication realtime, crons realmente ativos, secrets) está
> marcado **NÃO VERIFICADO**; o proxy usado foi `types.ts` (tabelas, colunas, RPCs e enums como estão no
> banco) e as migrations (histórico).
>
> Legenda: **AUSENTE** = documentado, não existe no código · **PARCIAL** = existe, mas não entrega o que
> o doc promete · **QUEBRADO** = existe e não funciona (erro em runtime) · **SIMULADO** = existe e exibe
> dado inventado como real · **MORTO** = existe e nada o usa.

---

## 0. Resumo executivo

| Área | Itens | Destaques |
|---|---|---|
| 1. Documentado e inexistente | 24 | 11 hooks `*Real`, 6 hooks + 7 componentes CRUD, `useN8n`/`n8n-integration`, `public-api`, i18n multi-idioma, 13 tabelas de migrations que não estão no banco, 20+ componentes citados no `DOCUMENTATION.md` |
| 2. Existe mas está quebrado | 16 | OCR simulado marca entrega como entregue; Lalamove `getOrder` cria pedido; reset de senha não envia e-mail; LGPD erase falha em colunas inexistentes; `fretes_internos.deleted_at` inexistente; Ranking com embed sem FK; assistente de IA lê colunas inexistentes; `add_user_xp` revogado do front |
| 3. Simulações em UI de produção | 30 | DORA metrics, KPIs do mapa, alertas "IA" do dashboard executivo, OTIF simulado em Coletas, posição GPS interpolada, clima/trânsito fixo no assistente de IA, botão "Simular resposta WA" |
| 4. Botões e telas sem efeito | 45+ | Abas inteiras estáticas em `ConfiguracoesFrete`, `Configuracoes` (segurança), `Profile` (segurança); 30+ botões sem `onClick`; links para rotas inexistentes |
| 5. Integrações parciais | 14 | Bitrix só conta itens e não valida webhook; Rodonaves com 16 ações bloqueadas e 11 não testadas; Melhor Envio e Lalamove em sandbox por padrão; push sem servidor; roteirização Mapbox inexistente |
| 6. Automação | 9 | Motor de regras executa 3 de 7 ações e 1 de 5 gatilhos; webhooks de saída sem disparador; relatórios agendados sem agendador; feature flags sem leitor |
| 7. Segurança parcial | 20 | MFA cadastrável mas nunca exigido; passkey só cadastra; matriz de permissões não aplicada; 8 functions sem auth no código; CORS `*` em 27 functions; HMAC opcional no nexus; `mcp_exec` no banco |
| 8. Gamificação | 7 | streak nunca incrementa; conquistas = 0 no ranking; tabelas `rewards`/`user_gamification`/`task_gifts` não existem |
| 9. Banco | 15 | 27 RPCs sem consumidor; 14 tabelas órfãs; realtime sem publication para `audit_logs`/`user_levels`/`coletas`; soft delete sem views/purge/RLS; sem máquina de estados; `performance_metrics` nunca alimentada |
| 10. Observabilidade/SRE | 10 | SLOs sem medição; heartbeat não sonda nada; runbooks apontam para Lovable/Cloudflare; sem DR drill, restore test, chaos; Sentry sem Web Vitals |
| 11. Qualidade/CI | 12 | 4 testes testam a si mesmos; `test:rls` passa pulado se a rede falhar; `size-limit` fora do CI; madge nunca roda; e2e manual; sem CODEOWNERS |
| 12. Documentação aspiracional | 20+ | `INVENTARIO` "10/10", `PLANO` "39/39 ✅" com 9 itens falsos, ADRs com numeração duplicada, openapi com 7 functions a menos, CHANGELOG parado |
| 13. Código morto | 25+ | 2 hooks + 3 componentes sem importador; 10+ componentes só no barrel; 3 edge functions sem nenhum chamador |
| 14. Auditorias anteriores ainda abertas | 30+ | ver seção |

---

## 1. Documentado como pronto e inexistente no código (AUSENTE)

| # | Item prometido | Onde o doc promete | Estado real |
|---|---|---|---|
| 1.1 | Hooks `useAnalyticsReal`, `useDashboardMetricsReal`, `useSLAMetricsReal`, `useLogisticsCostsReal`, `useGamificationReal`, `useLalamoveTrackingReal`, `useBitrix24Real`, `useN8nReal`, `useEntregasReal`, `useColetasReal`, `useTransportadorasReal` | `docs/MELHORIAS.md:21-33,63-73` ("Hooks Real (Produção) 100%"); `docs/MIGRATION-GUIDE.md:9-17,56` (ensina a importá-los de `@/hooks`); `docs/INVENTARIO_FUNCIONALIDADES.md:102-110`; `docs/agentes/regras-dominio.md:40-44` | Nenhum existe em `src/` (zero exports, zero usos). Os hooks base (`useAnalytics`, `useDashboardMetrics`, `useSLAMetrics`, `useLogisticsCosts`) já consultam Supabase direto (`src/hooks/analytics/useAnalytics.tsx:57`, `useDashboardMetrics.tsx:61`, `src/hooks/logistics/useSLAMetrics.tsx:10`, `useLogisticsCosts.tsx:48`). A regra em `regras-dominio.md` ("confira se a tela consome o hook Real") manda procurar algo que não existe. |
| 1.2 | Hooks CRUD `useSavedFilters`, `useVersions`, `useDuplicate`, `useInfiniteScroll`, `useFulltextSearch`, `useActivityLog` | `docs/README-CRUD.md:9-54,98`; `docs/MELHORIAS.md:50-58` | Zero ocorrências em `src/`. |
| 1.3 | Componentes `SavedFiltersDropdown`, `DataImporter`, `VersionHistory`, `TrashBin`, `AdvancedFilter`, `DuplicateDialog`, `InfiniteList` | `docs/README-CRUD.md:59-86`; `docs/MELHORIAS.md:78` ("Components CRUD 18+ 100%") | Zero ocorrências em `src/`. |
| 1.4 | Tabelas `saved_filters`, `entity_versions`, `activity_logs`, `n8n_workflows`, `n8n_execution_logs`, `lalamove_orders`, `lalamove_stops`, `lalamove_status_history`, `user_gamification`, `rewards`, `reward_redemptions`, `rank_badges`, `task_gifts` | `docs/MELHORIAS.md:37-41,97-103`; `docs/MIGRATION-GUIDE.md:66-72` ("Migrations necessárias ✅"); `docs/README-CRUD.md:90-93`; `docs/ARCHITECTURE.md:132-138` (`rewards`, `activity_logs`) | Criadas em `supabase/migrations/` (`20241231000000_saved_filters.sql`, `20251221200001-3_*`, `20260102100001-3_*`, `20240822_gamification_system.sql`) e **ausentes em `types.ts`** → não existem no banco (as Lalamove foram dropadas em `20260831120100_drop_legacy_objects_d2.sql:13-15`). |
| 1.5 | Edição concorrente via `entity_versions` | `docs/agentes/regras-dominio.md:32` | Tabela não existe no banco; zero referências em `src/`. Conflitos são last-write-wins. |
| 1.6 | Integração n8n (`useN8n`, `useN8nReal`, `supabase/functions/n8n-integration`, trigger `notify_n8n_webhook`, `VITE_N8N_WEBHOOK_URL`) | `DOCUMENTATION.md:416-418`; `docs/MELHORIAS.md:30,41,150`; `docs/INTEGRACAO_CONFIG.md:81-130` | Nada existe. Única menção em `src/`: card de status "n8n" em `src/pages/Configuracoes.tsx:75`. Variável no `.env.example:18` que ninguém lê. |
| 1.7 | API pública REST (`supabase/functions/public-api`, endpoints `/api/entregas`, `/api/coletas`…) | `DOCUMENTATION.md:419`; `docs/CHANGELOG.md` 0.6.0 ("API Documentation"); `docs/PLANO_MELHORIAS_2026.md:63` ("10 endpoints documentados") | Não há function `public-api`, pasta `api/` nem rewrite em `vercel.json`. A página `src/pages/APIDocumentation.tsx:20-30` documenta endpoints **fictícios** (`/api/entregas`, `/api/clientes`, `/api/smart-carrier`…) e um domínio `https://api.loggi-flow.com` (`:170`) que não existe; botão "Swagger UI" sem `onClick` (`:76`). As únicas funcionalidades com equivalente são `predict-delays` e `smart-carrier-selection`, em `/functions/v1/…`. |
| 1.8 | Internacionalização PT-BR / EN / ES (`src/i18n/index.ts`, `src/i18n/locales/*.json`) | `DOCUMENTATION.md:495-513`; `TEMPLATE_STRUCTURE.md:374,434-436` | `src/i18n.ts` inicializa i18next só com pt-BR inline; não há `locales/`; nenhum `useTranslation` em `src/`. Dependências `i18next`/`react-i18next` instaladas sem uso real. |
| 1.9 | Componentes `MobileCardView` (5.1) e `LoadingStates` (5.4) | `docs/PLANO_MELHORIAS_2026.md:44,53` (✅) | Não existem (há `ResponsiveTable` e `LoadingSpinner`, com outra API). |
| 1.10 | Testes `src/test/validateCNPJ.test.ts`, `useDocumentUpload.test.ts`, `queryConfig.test.ts` | `docs/PLANO_MELHORIAS_2026.md:60-61,81-83` | `src/test/` só tem `setup.ts`. Nenhum teste cobre `validateCNPJDigits`, `useDocumentUpload` ou `QUERY_STALE_TIME`. |
| 1.11 | Testes de `usePagination`, `useFilters`, `useSorting`, `useSelection`, `useRealtime`, `useLocalStorage`, `Pagination`, `FilterBar` | `docs/ARCHITECTURE.md:88-92`; `CHANGELOG.md:58-59`; `CONTRIBUTING.md:22`; `docs/MELHORIAS.md:85-86` | Nenhum dos 37 arquivos de teste (fora e2e) cobre esses hooks/componentes. |
| 1.12 | Service worker manual com cache-first / stale-while-revalidate / network-first (`public/sw.js`) | `docs/PLANO_MELHORIAS_2026.md:42`; `docs/INVENTARIO_FUNCIONALIDADES.md:111`; `DOCUMENTATION.md:384-410` | `public/sw.js` não existe (removido em #198); `vite.config.ts:48-74` usa `VitePWA` sem `workbox.runtimeCaching`. |
| 1.13 | Componentes citados no `DOCUMENTATION.md`: `src/components/analytics/{DemandForecastChart,KPIBenchmarkDashboard,MonthlyComparisonChart,RegionHeatmap,TransportadoraComparisonChart}.tsx`, `common/{CommentSectionWithMentions,DataTable,TooltipWrapper}.tsx`, `gamification/XPProgressCard.tsx`, `map/DeliveryMap.tsx`, `notifications/PushNotificationSettings.tsx`, `tracking/{DriverTrackingMap,TrackingHeatmap}.tsx`, `AchievementUnlockModal`, hooks `useBitrix24`, `useDelayNotifications`, `useForm`, `useMentions`, `src/lib/{premiumToast.tsx,toast.ts}` | `DOCUMENTATION.md` (seções Analytics, Notificações, Gamificação, Rastreamento, UI) | Nenhum existe. |
| 1.14 | Hooks `useAIAssistant`, `useRodonaves`, `useShipping` | `docs/INVENTARIO_FUNCIONALIDADES.md:102-110` | Não existem (`AIAssistant.tsx` usa `fetch` direto; `CotacaoFrete` usa `useQuotationFlow`; `KanbanEntregas` usa `useQuery` local). |
| 1.15 | Sequências de teclado `G+D`, `G+C`; "10 atalhos globais + modal `Shift+?`" | `docs/INVENTARIO_FUNCIONALIDADES.md:86`; `docs/PLANO_MELHORIAS_2026.md:51` | `src/hooks/common/useKeyboardShortcuts.ts` não implementa sequências (≈6 atalhos); o modal `KeyboardShortcutsHelp` abre com `Ctrl+/`; `KEYBOARD_SHORTCUTS.help` em `src/lib/constants.ts:150` não é usado. |
| 1.16 | Roteirização / Directions com Mapbox ("roteirização e visualização de frotas") | `docs/INVENTARIO_FUNCIONALIDADES.md:63` | Nenhuma chamada a Directions/Optimized Trips em `src/` nem functions. Mapbox foi trocado por MapLibre (#180). |
| 1.17 | Prazo Rodonaves integrado ao calendário logístico (2.3 ✅) | `docs/PLANO_MELHORIAS_2026.md:21` | `getDeadline` só é disparado em `src/components/freight/RodonavesQuotation.tsx:40` e não é persistido; `useLogisticsCalendar` consulta só `coletas`, `entregas`, `transportadoras`. |
| 1.18 | Views `v_active_<tabela>` e purge mensal de `deleted_at > 365 dias` | `docs/SOFT_DELETE_POLICY.md:19-26` | Nenhuma view `v_active_*` em `types.ts`; nenhum cron de purge. Das tabelas listadas, `cotacoes` e `perfis` não existem; `cotacoes_frete` e `profiles` não têm `deleted_at` (só `entregas`, `transportadoras`, `clientes`, `fornecedores`, `coletas`…). A RLS de `entregas` não filtra `deleted_at` (`20260901000001_remediacao_destino.sql:47`). |
| 1.19 | RPC `force_logout_all`, componente `AdminSettings`, "script de contingência de rollback de migration" | `docs/INCIDENT_PLAYBOOK.md:8-20` | Nenhum existe. |
| 1.20 | `logs_acesso`, `notificacoes` apagados pelo LGPD erase; anonimização por hash; "toda consulta a PII registrada em `audit_logs` com Correlation ID" | `docs/LGPD_COMPLIANCE.md:9-17` | Tabelas não existem; a function não toca `notifications`; anonimização usa valores fixos (e falha, ver 2.4); `audit_logs` não tem coluna de correlation id e só registra escrita (trigger), nunca leitura. |
| 1.21 | Monitor de uptime externo (UptimeRobot / Better Stack), "client-side heartbeats" de realtime | `docs/SLO.md:9-13`; `docs/SRE_HANDBOOK.md:17`; `docs/INCIDENT_RESPONSE.md:15` | Nenhuma configuração ou referência no repo. |
| 1.22 | Fonte `docs/contexto/supabase/` (banco ao vivo) do pipeline de contexto para agentes | `docs/agentes/contexto-ia.md:14,46-48`; `AGENTS.md` | Nunca gerada: `00-INDEX.md` na branch `contexto` marca "ainda não gerado"; falta o secret `SUPABASE_DB_URL` (não verificável pelo repo). A pasta `regras/manual/` só tem README e template (nenhuma regra humana escrita). |
| 1.23 | `MAPBOX_ACCESS_TOKEN` e `LALAMOVE_ENV` como secrets | `docs/INTEGRACAO_CONFIG.md:25,52,57,69,79` | O código lê `MAPBOX_PUBLIC_TOKEN` (`get-mapbox-token/index.ts:14`) e `LALAMOVE_BASE_URL` (`lalamove-api/index.ts:10`); `LALAMOVE_ENV` não é lido por ninguém; `lalamove-tracking/index.ts:7` fixa a URL de sandbox. |
| 1.24 | Diagramas ER/C4 e `docs/infra/supabase.tf` como infraestrutura | `docs/ER_DIAGRAM.md`; `docs/ARCHITECTURE_C4.md`; `docs/infra/supabase.tf` | ER cita `audit_logs.old_record/new_record` (colunas reais: `old_data`/`new_data`); C4 ainda descreve "Lovable Cloud" como backend; o `.tf` tem recurso fictício `lovable_project` e nenhum workflow o aplica. |

---

## 2. Existe, mas está quebrado (QUEBRADO)

| # | Funcionalidade | Evidência | Efeito |
|---|---|---|---|
| 2.1 | **OCR de comprovante** (`ocr-receipt-processor`) | `supabase/functions/ocr-receipt-processor/index.ts:52-66`: `// Simulate OCR Processing`, `setTimeout 2000`, dados fixos `receiver_name: "CARLOS ALBERTO SILVA"`, `document_number: "MG-12.345.678"`, `confidence 0.98`; o arquivo baixado nunca é lido | `:70-76` grava `ocr_data_extraida` falso e **força `entregas.status = 'entregue'**; `delivery_receipt_audit.ocr_status = 'processed'`. Chamado por `src/components/shipping/DeliveryReceiptUpload.tsx:112`. |
| 2.2 | **Lalamove: consultar e cancelar pedido** | `lalamove-api/index.ts:126,136,146` roteia por `req.method`; `src/hooks/logistics/useLalamoveOrders.tsx:63-82` usa `functions.invoke` (sempre POST) com `method` no body, ignorado em `:127` | `getOrder` cai no ramo de **criar pedido** (POST `/v3/orders` com payload vazio); `cancelOrder` cai em 404 `Route not found` (`:155`). |
| 2.3 | **Reset de senha aprovado pelo admin** | `send-password-reset/index.ts:124-130` chama `auth.admin.generateLink` (só gera o link, não envia); nenhum `fetch`/Resend no arquivo; responde `"Password reset email sent"` (`:164`) após marcar `approved` (`:146-153`) | O usuário nunca recebe o e-mail; o pedido fica como aprovado. Fallback de `origin` para o projeto morto `uwbpzfcysppwikfpnzok.lovableproject.com` (`:117`). |
| 2.4 | **Apagamento LGPD** (`lgpd-erase-user`) | `index.ts:66-73` atualiza `entregas` com `cliente_nome`, `cliente_email`, `cliente_documento` e filtro `user_id`, **colunas inexistentes** em `entregas` (`types.ts`); `:83-90` insere `audit_logs` com `event`/`metadata` inexistentes | Falha com 400 **depois** de já ter apagado `profiles` (`:58-61`); usuário de auth não é apagado. Sem consumidor em `src/`. |
| 2.5 | **Alerta WhatsApp de atraso previsto** | `predict-delays/index.ts:311-328` seleciona `profiles(phone)`; `profiles` não tem `phone` | Nenhum alerta sai. Mesmo padrão em `normalize-freight-response/index.ts:175`. |
| 2.6 | **Auto-cura de coletas** (`nexus-auto-healing`) | `index.ts:48-57` usa `coletas.data_coleta_efetiva`; coluna real `data_efetiva_coleta`; erro ignorado | Reparo de coletas nunca executa; a UI (`RealtimeStatus.tsx`) mostra sucesso. |
| 2.7 | **Fretes internos, Relatórios e drill-down** | `src/pages/FretesInternos.tsx:173`, `src/pages/Relatorios.tsx:114-117`, `src/hooks/analytics/useDrillDown.tsx:99-101` filtram `.is("deleted_at", null)` em `fretes_internos`, que **não tem `deleted_at`** em `types.ts` nem em migrations | Consulta tende a falhar (42703) → lista de fretes internos vazia/erro. **NÃO VERIFICADO em runtime.** |
| 2.8 | **Ranking** | `src/pages/Ranking.tsx:66-80` faz embed `profiles:user_id(full_name, avatar_url)` em `user_levels`, cuja FK aponta para `auth.users` (sem relação com `profiles` em `types.ts`); período (`:56`) só entra na `queryKey`; `achievements: 0 // Simplified for now` (`:111`) | Embed provavelmente falha no PostgREST; filtro de período não filtra; card "Conquistas" e pódio sempre 0. **NÃO VERIFICADO em runtime.** |
| 2.9 | **Assistente de IA: contexto operacional** | `ai-logistics-assistant/index.ts:75,78` seleciona `score_frete`, `score_pontualidade` (transportadoras) e `gravidade`, `status='aberta'` (ocorrencias): colunas inexistentes; erros não verificados | O LLM responde sem transportadoras nem ocorrências; clima/trânsito são texto fixo (`:95-99`). |
| 2.10 | **Linha do tempo do despacho** | `src/components/shipping/ExpeditionDetailsDialog.tsx:79-91` embed `action_by_user:profiles(display_name, avatar_url)` em `kanban_history` (sem FK para profiles; `display_name` não existe) | Aba de timeline sempre vazia (erro engolido). |
| 2.11 | **Gestão de clientes Rodonaves** (`RTECustomerManager`) | `src/components/rodonaves/RTECustomerManager.tsx:26,42,57,73` chama actions `get-customer-by-key`, `get-customer-full`, `list-customers`, `list-customer-addresses`, inexistentes em `rodonaves-api` (`Unknown action`, `index.ts:1326`); botão "Novo" endereço descarta o estado (`:19`) | Tela `/gestao-rodonaves` falha em todas as ações de cliente (que, além disso, estão bloqueadas pela RTE com 403). |
| 2.12 | **Teste de conexão Bitrix24 em Configurações** | `src/hooks/security/useIntegrationValidation.tsx:65-66` envia action `test-connection`; a function não a trata → 400 | Bitrix24 aparece sempre como erro em `Configuracoes.tsx`. |
| 2.13 | **XP pelo front** (`add_user_xp`) | `supabase/migrations/20260711183644_*.sql:42` e `20260711192237_*.sql:25` revogam EXECUTE de `authenticated`; nenhuma migration posterior reconcede; `src/hooks/gamification/useGamification.ts:159` e `useOnboarding.tsx:148` chamam a RPC | Onboarding e ações de XP falham com 403. **NÃO VERIFICADO no banco ao vivo.** |
| 2.14 | **Log de entrega de webhook** | `webhook-status/index.ts:127-137` insere `metadata` em `webhook_deliveries`, coluna inexistente; retorno não checado | Entregas de webhook não ficam registradas. |
| 2.15 | **Rodonaves: CNPJ remetente padrão** | `rodonaves-api/index.ts:853,865,878,900,976,1052`: `requireString(cnpjRemetente)` lança antes do `\|\| cnpjDefault` | Nas 6 ações de rastreio em lote/pedidos/cubagem, o secret `RODONAVES_CNPJ_REMETENTE` nunca é usado. |
| 2.16 | **Timeline em `MissionDetail`** | `src/components/dashboard/MissionDetail.tsx:46` consulta `integracoes_bitrix` (`as never`), tabela inexistente em `types.ts` | Query falha silenciosa; timeline cai no `mockTimeline` (`:70`). |

---

## 3. Simulações exibidas como dado real (SIMULADO)

| # | Onde | O que é falso |
|---|---|---|
| 3.1 | `src/components/admin/DORAMetrics.tsx:89-111` (em `/admin/telemetria`) | Todas as métricas DORA são literais (`4.2/dia`, `45min`, `0.8%`, `12min`, tendências). |
| 3.2 | `src/features/incidents/components/PostMortemDashboard.tsx:17-45` (em `/admin/telemetria`) | 2 incidentes literais (`INC-2026-001/002`) em `useState`; botão "Novo Relatório" sem `onClick` (`:63`). |
| 3.3 | `src/components/layout/SystemPulse.tsx:8-11,53` | Status/latência fixos ("Motor de IA online 42ms"); barras `Math.random()`. |
| 3.4 | `src/components/dashboard/LiveStatusBar.tsx:27-33,57` | "Ping" é um random walk. |
| 3.5 | `src/components/dashboard/LogisticsMapWidget.tsx:421-469,240-262,1069-1075` | Modal "Nexus Performance Engine" com KPIs literais (`94.2%`, `98.8%`, `1.4d`) e gráfico inline; "Auto-Otimizar" é `setTimeout(2000)` + toast "Logística otimizada via IA!"; botão Bitrix abre `https://bitrix24.com` genérico. |
| 3.6 | `src/components/dashboard/MissionDetail.tsx:69-70,239` | `mockTimeline` sintético por status. |
| 3.7 | `src/components/dashboard/BiometricConsentModal.tsx:24-31` | "Scan biométrico" é `setTimeout(2500)`. |
| 3.8 | `src/components/dashboard/AlertsPanel.tsx:419` | "Processamento em Tempo Real (8ms latência)" fixo. |
| 3.9 | `src/components/freight/NexusCoverageMap.tsx:14-19` (em `CotacaoMultiCanal`) | Mapa de cobertura usa `SAMPLE_DATA` fixo. |
| 3.10 | `src/components/freight/NegotiationAssistant.tsx:35-43` | "12% abaixo da média" fixo; botões "Argumentos"/"Aceitar Oferta" sem `onClick`. |
| 3.11 | `src/components/coletas/PickupConference.tsx:130-146` | OCR de documento simulado (`setTimeout 1.5s`, "98% de precisão"). |
| 3.12 | `src/components/coletas/PickupDetailsDialog.tsx:161-162,310-325` | Custo "estimado" por fórmula fixa; documentos GED literais (`Nota_Fiscal.pdf`, `Romaneio_Grid.xlsx`); "Anexar_Doc" sem `onClick`. |
| 3.13 | `src/components/map/CinematicHUD.tsx` | Telemetria e coordenadas fixas (`SAT_LOCK: 14_FIXED`, `LAT: -23.550523`). |
| 3.14 | `src/components/labels/MaterialLabelPrinter.tsx:168` | PDF com texto placeholder no lugar do QR Code. |
| 3.15 | `src/pages/DashboardExecutivo.tsx:337-377` | "Alertas Preditos (IA)" e "Metas em Foco" são texto fixo ("Obras na BR-116…", "economia de 12%", "92.4%"). Nenhuma das 6 queries trata loading/erro/vazio: sem dado a tela mostra zeros como reais. |
| 3.16 | `src/pages/CotacaoFrete.tsx:231-256` | Card "Economia Garantida" com `R$ 12.450,00` / `- R$ 3.120,00` fixos. |
| 3.17 | `src/pages/Coletas.tsx:172-191,310-340,397-405` | OTIF "simulado", `leadTime: "18.4h" // Simulado`, gráfico semanal inline, badges `ESTÁVEL`/`-5% REDUÇÃO`, mini-barras literais. |
| 3.18 | `src/pages/InteligenciaFrete.tsx:613-680` | "Ações Corretivas" estáticas (`+40%`, `R$ 4.200`); 4 botões sem `onClick`. |
| 3.19 | `src/pages/CotacaoMultiCanal.tsx:328-364,256-258,571,590-604` | "Cotar via API" **não chama API**: calcula `taxa_fixa + preco_por_kg*peso` localmente e grava `status: "respondido"`; blast WhatsApp só registra `pendente` ("automation would trigger here in real scenario"); Select "Estratégia Nexus" sem `onValueChange`; pesos `70/20/10` fixos e nem correspondem ao cálculo real (70/30). A busca inicial (`:129`) chama a Rodonaves de verdade. |
| 3.20 | `src/pages/DashboardCotacoes.tsx:273-301,602,625-628` | Botão "Simular Resposta WA" insere cotação falsa com `transportadora_id` fixo; texto "[Simulado] Cotação enviada via … Aguardando gateway"; "Forçar Retentativa" só dá toast. |
| 3.21 | `src/pages/RastreamentoRealTime.tsx:145-160,712` | Posição do caminhão interpolada por fator fixo conforme status (`// Simulate truck position`), não GPS; "Acionar Nexus Support_API" sem `onClick`. |
| 3.22 | `src/pages/MapaRotas.tsx:266-285,71,157-172` | "Time travel": posições históricas inventadas (marcadores puxados para a origem por fator do slider); telemetria biométrica consultada e descartada (`const [, setBioData]`). |
| 3.23 | `src/hooks/logistics/useLogisticsIntelligence.tsx:18,31` (alimenta `IntelligentLogisticsWidget`) | `otif = 92 // Simulated`, `highVolumeSP = true // Simulated detection`; botão "Iniciar Processamento" sem `onClick`. |
| 3.24 | `supabase/functions/ai-logistics-assistant/index.ts:95-99` | Clima e trânsito fixos ("Instável na região Sul (risco de lentidão na BR-101)") apresentados ao LLM como "dados em tempo real". `INVENTARIO:46` promete análise de clima e trânsito. |
| 3.25 | `supabase/functions/predict-delays/index.ts:188` | Fator "clima" é só um rótulo pedido ao LLM; não consulta `get-weather-data`/OpenWeather. |
| 3.26 | `src/pages/IntegracaoBitrix.tsx:181`, `src/pages/ConfiguracoesFrete.tsx:418`, `src/pages/ConciliacaoAutomatica.tsx:248` | "Latência média: 145ms", "94.8% OPTIMIZED", "Conciliados 100%" fixos. |
| 3.27 | `src/pages/auth/AuthHeroSection.tsx:36,83,96` | Depoimentos, "150 empresas", "99.9% Uptime" de marketing fixos. |
| 3.28 | `src/pages/PainelSLA.tsx:68,237` | Metas de SLA persistem só em `localStorage`. |
| 3.29 | `src/pages/admin/QualityGate.tsx` | Lê `public/quality-gate-report.json` estático, não dados ao vivo. |
| 3.30 | `src/components/analytics/AnalyticsCharts.tsx:26-32` | Fallback com meses zerados "for visual stability" quando não há dados. |

---

## 4. Botões, controles e telas sem efeito (PARCIAL)

**Telas/abas inteiramente estáticas**

| Onde | O que |
|---|---|
| `src/pages/ConfiguracoesFrete.tsx:960-1067` (aba "automacao") | Switches não controlados (`defaultChecked`), parâmetros `3/15m/60m` literais. |
| `src/pages/ConfiguracoesFrete.tsx:380-461` (aba "malha") | "Nova Região" sem `onClick`; zonas literais; Select não controlado; switches de zona só-leitura. |
| `src/pages/ConfiguracoesFrete.tsx:820-955` (aba "integracoes") | Lista `freight_integration_mappings`, tabela que **nenhum código popula**; "Novo Gateway de Resposta" sem `onClick`; card Parser com `Input defaultValue` sem persistência; ícone Settings sem ação. Busca de transportadoras sem `onChange` (`:237`). |
| `src/pages/Configuracoes.tsx:343-378` (aba "security") | API Key/Webhook Secret mascarados fixos, "Regenerar" sem `onClick`, switches não controlados, "Salvar" não persiste (`:54-60`). |
| `src/pages/Profile.tsx:240-256` (aba "security") | Input de senha sem estado; "Alterar" e "Configurar" (2FA) sem `onClick`. |
| `src/pages/APIDocumentation.tsx` | Página inteira estática (ver 1.7). |

**Botões/ações sem handler** (todos verificados): `ExpeditionDetailsDialog` "Log Detalhado" (toast "em desenvolvimento"); `AuditTrailViewer` "Restaurar" em massa (só toast); `IntegracaoBitrix` "Abrir CRM"; `RastreamentoPublico` "CENTRAL"; `FreightTableManager` "Importar CSV"; `RotaResultsList` "Contato"/"Email" (os dados existem em `transportadoras`, o tipo não os declara); `NotificationCenter` "Configurações"; `UserNotificationCenter` "Preferências de Email"; `AlertsPanel` "ACESSAR TERMINAL COMPLETO"; `PerformanceChart` ícones Refresh/Maximize; `TelemetryViewer` chevron de expandir; `LogisticaReversa` "Nova Solicitação" (o hook tem `create`, a página não liga), "Filtros", "Exportar", item "Detalhes"; `MobileQuickActions` "AIAssistant" só navega para `/configuracoes`.

**Links para rotas inexistentes:** `GlobalSearch.tsx:128` → `/rastreamento` (só existe `/rastreamento/:id`), `:155` → `/profile` (rota é `/perfil`); `QuickActions.tsx:47` → `/rastreamento-publico` (rota é `/rastrear`), `:201` → `/historico`; `Breadcrumbs.tsx:62,109` e `useNavigationHistory.tsx:44` → `/gestao-melhor-envio` (rota é `/melhor-envio`).

**Rotas sem entrada em nenhuma navegação:** `/admin/adr`, `/admin/quality-gate`, `/rate-limit` (admin); `/admin/telemetria` só pela busca global.

**Mapas:** `MapboxMap` suporta `onMarkerClick` (`:32,512`), mas `RastreamentoRealTime.tsx:471` e `MapaRotas.tsx:330` não passam a prop: clicar em veículo/entrega não faz nada.

**Deep link ignorado:** `predict-delays-scheduled/index.ts:113` grava `action_url=/central-rastreamento?entrega=<id>`, mas `CentralRastreamento.tsx` não lê `searchParams`.

**Estados ausentes em páginas com fetch:** sem tratamento de erro em ~30 páginas (`DashboardExecutivo`, `DashboardCotacoes`, `Conquistas`, `MapaRotas`, `PainelOTIF`, `RelatorioPDF`, `ConciliacaoAutomatica`, `Index`, `Analytics`, `SLADashboard`, `CustosDashboard`, `AlertasCusto`, `CalendarioLogistico`, `CentralRastreamento`, `InteligenciaFrete`, `LogisticaReversa`, `RastreamentoRealTime`, `CotacaoFrete`, `ConciliacaoFinanceira`, `Coletas`, `Transportadoras`, `Relatorios`, `PainelSLA`, `GerenciamentoUsuarios`, `ExportacaoDados`, `Ranking`, `KanbanEntregas`, `LojaRecompensas`, `RotasTransportadoras`, `AdminADR`); sem loading em 7 delas. Tratam os três estados: `Envios`, `Clientes`, `Fornecedores`, `FretesInternos`, `Notificacoes`, `Ocorrencias`, `AdminTelemetria`.

---

## 5. Integrações parciais

| # | Integração | Prometido | Real |
|---|---|---|---|
| 5.1 | **Bitrix24** | "Sync bidirecional de Deals e Contatos" (`INVENTARIO:60`, `PLANO:19`, `openapi.yaml:167`); SPAs 1502/1690 (`INTEGRACAO_CONFIG.md:138-143`); webhook de entrada | `sync_deals` **só conta itens** e grava a contagem em `audit_logs` (`bitrix24-integration/index.ts:169-182`); `webhook` só loga em `audit_logs` sem validar assinatura e espera JSON (Bitrix envia form-urlencoded); **nenhum `crm.contact.*`**; usa SPAs 1186/1234/1050; `OWNER_ID`/`RESPONSIBLE_ID` fixos em 1; a URL salva pela tela em `bitrix_sync_config` é ignorada (a function lê só `BITRIX24_WEBHOOK_URL`); `bitrix_sync_logs` nunca é gravada (tela mostra "última sincronização" vazia); trigger insere `PENDING_ALERT` que ninguém processa (`20260522135837_*.sql:43-44`); sem circuit breaker/retry. |
| 5.2 | **Lalamove** | Criação de pedidos on-demand, rastreamento real-time (`INVENTARIO:59`) | Consultar/cancelar quebrados (2.2); `lalamove-tracking` e o hook fixam `useSandbox = true` (`index.ts:45`, `useLalamoveTracking.tsx:65`); tabelas `lalamove_orders/stops/status_history` dropadas, `useLalamoveOrders` não persiste nada; webhook sem `default` (eventos desconhecidos marcados como processados); comparação de assinatura não constant-time (`lalamove-webhook/index.ts:44`). |
| 5.3 | **Rodonaves (RTE)** | "Cotação, Coleta, Rastreamento e Webhooks" (`INVENTARIO:58`); 70+ endpoints (`ANALISE_API_RODONAVES.md`) | 60 actions implementadas, mas `src/lib/rodonaves/capabilities.ts` marca **16 bloqueadas (403 da RTE)** — todo o gateway Customer (cadastro/endereços), comprovantes de ocorrência, cubagem, `pickup-resend-express` —, **11 não testadas** (todas as de coleta: `pickup-create`, `pickup-cancel`, `pickup-reschedule`…, `orders`, cotação digital) e **2 instáveis** (`generate-quotation`, `generate-first-quotation` com HTTP 500 na RTE). A matriz (`isActionAvailable`) não é usada por nenhuma UI; `RTEPickupActions` (cancelar/reagendar coleta) e `RTECepAutoFill` não são importados por nenhuma página; `normalizeRTEEvent`/`freightHealth` sem consumidor; `resolve-address` e `check-coverage` fora da matriz; gateways `dne`/`payments` declarados sem uso. `useRodonavesWebhook.tsx:22` chama o webhook do browser sem HMAC (401). |
| 5.4 | **Melhor Envio** | "36 endpoints" (`openapi.yaml:151`) | 34 actions; `useSandbox = true` por padrão (`index.ts:60`); User-Agent com e-mail fixo (`:67`). |
| 5.5 | **WhatsApp (A-Ticket / Evolution)** | "Notificações automáticas de status para o cliente final" (`INVENTARIO:61`) | `whatsapp-notification` sem auth no código e com link fixo `https://logiflow-nexus.lovable.app/rastreamento/` (`:165`); `useWhatsAppNotification` não é usado por nenhuma tela; `evolution-whatsapp` só alcançável por hook morto (`useEvolutionWhatsApp`); `check_status` não confere `response.ok`; alertas por telefone nunca saem (2.5); `openapi.yaml:173-177` descreve `evolution-whatsapp` como webhook público, mas é só saída autenticada. |
| 5.6 | **Push notifications** | "Notificações do navegador" (`DOCUMENTATION.md:243`); tabela `push_subscriptions` | `usePushNotifications.tsx:13-16` usa **chave VAPID de demonstração hardcoded**; nenhuma edge function lê `push_subscriptions` para enviar; o hook não é montado em nenhuma tela. |
| 5.7 | **E-mail (Resend)** | "E-mail transacional (Auditoria, Login, Alertas)" | Funciona em `resend-email`, `new-device-alert`, `log-security-event`, `scheduled-reports`, digest; **não** no reset de senha (2.3). `new-device-alert` aceita `user_email` do body sem auth. |
| 5.8 | **Mapbox / mapas** | Token via `get-mapbox-token`; roteirização | `get-mapbox-token` não tem nenhum chamador em `src/` (só constante em `lib/constants.ts:129`); sem Directions (1.16). |
| 5.9 | **OpenWeather** | Previsão de atrasos "baseada em clima" | `get-weather-data` sem chamador em `src/` nem nas functions de predição; `useMapWeatherSync` lê só `risk_zones`. |
| 5.10 | **Banco externo** (`external-db-bridge`) | "Ponte para Supabase externo (catálogo)" | Auth **opcional** (`index.ts:123-138`, userId só para telemetria); CRUD + RPC livres com service key de outro projeto; único hook (`useExternalDbBridge`) não é usado por nenhuma tela. |
| 5.11 | **Carrier webhook genérico** (`carrier-webhook-receiver`) | "Webhook genérico multi-transportadora" | Valida HMAC e idempotência mas **só grava em `automation_audit_logs`** (`index.ts:83-88`); não atualiza entrega nem status. |
| 5.12 | **Ingestão de entregas/coletas** | — | Nenhuma function ou webhook **insere** `entregas`/`coletas` (só update); nascem apenas pela UI (`Envios.tsx:427`, `PickupDialog.tsx:167`). Explica `ai_delay_predictions = 0` (`prod-readiness.md` §4). |
| 5.13 | **Secrets** | Catálogo em `scripts/ops/set_missing_secrets.sh` | `ALLOW_TEST_MODE` (lido em `lalamove-webhook:89`, `rodonaves-webhook:64`) está fora do catálogo. O catálogo diz que sem Upstash "o rate limit usa memória", mas `_shared/rateLimiter.ts` usa a tabela `rate_limit_logs` e nunca Redis (Redis é só cache de cotação). |
| 5.14 | **`VITE_BITRIX24_WEBHOOK`** | `AUDITORIA_BACKEND` sprint A item 2 "remover do front" | Saiu de `src/`, mas continua em `.env.example:10` e, segundo `docs/agentes/deploy.md:59`, na Vercel (**NÃO VERIFICADO**). |

---

## 6. Automação, webhooks de saída, relatórios e flags

| # | Item | Real |
|---|---|---|
| 6.1 | **Motor de regras** ("Se X então Y", `INVENTARIO:52`, `DOCUMENTATION.md:415`) | `useBusinessRuleEngine.tsx:96-133` executa só `send_notification`, `create_alert`, `change_status`; `send_email`, `add_tag`, `assign_user`, `block_carrier` (declarados em `useBusinessRules.tsx`) **não têm execução**; nenhuma ação WhatsApp. Gatilhos `on_create`, `on_update`, `low_performance`, `high_cost` e entidades `ocorrencia`/`frete` **nunca disparam**: o único disparador é `useRuleTriggers.ts:14-25` (`on_status_change`, só coleta/entrega, só no browser; sem trigger de banco). Erros ignorados e `rule_execution_logs` registra como executadas inclusive as ações sem implementação (`:141-156`). |
| 6.2 | **Webhooks de saída para ERP/CRM** (`INVENTARIO:53`, tela `/webhooks`) | Nenhum trigger ou function dispara entregas em eventos; a única gravação em `webhook_deliveries` é `webhook-status` action `notify_status_change`, que **nenhum código em `src/` chama**; `freight_webhooks` sem referência. Além disso: `fetch` cru para URL do cliente sem allow-list (SSRF armazenado, `:107`), qualquer logado lista todos os webhooks (`:59-62`), insert com coluna inexistente (2.14), `Action not implemented` para o resto (`:193`). |
| 6.3 | **Relatórios agendados — envio real** (`PLANO:35` ✅) | Nenhum cron/agendador chama `scheduled-reports`; `frequency` nunca é lida; `last_sent_at` nunca atualizado; envio só manual pela ação `generate`; `userId` vem do body sem auth (`index.ts:16`); `default` responde "Tipo de relatório não suportado". |
| 6.4 | **Feature flags** ("controle remoto sem deploy", ADR 0005; "kill-switch", ADR 0012) | `useFeatureFlag`/`useFeatureFlags` só no barrel; **nenhuma tela usa**; sem UI de admin para escrever; flags semeadas (`ai-assistant-v2`, `carrier-negotiation-ai`, `realtime-tracking-lalamove`) sem leitor; `db-regression-monitor/index.ts:29` fixa `threshold = 100` e ignora `db_regression_threshold_pct`. |
| 6.5 | **Alerta de regressão em tempo real** (ADR 0012) | `useDbRegressionAlerts` só é montado em `/admin/db-health`; o toast "Abrir painel" aponta para a página em que o usuário já está. |
| 6.6 | **Auto-cura automática** (`integracoes.md:69` "chamadas por pg_cron") | `nexus-auto-healing` só roda por botão manual (`RealtimeStatus.tsx`); `execute-protocol` só via `LogisticsMapWidget`; `ingest-biosync`, `webhook-status`, `health` sem cron versionado. A RPC `execute_nexus_protocol` **só insere um log** (`20260520163558_*.sql:6-19`) — o botão de "protocolo" não executa nada. |
| 6.7 | **Preferências de notificação** | Salvas em `user_notification_preferences` (`Configuracoes.tsx:97-105`), mas triggers (`notify_*`) e functions não as leem (única leitura: `notifications_sla` em `predict-delays:313`). |
| 6.8 | **Agendamento 30 min × cache 6 h** | `predict-delays-scheduled` roda a cada 30 min, mas `predict-delays` cacheia 6 h: quase todas as rodadas não geram previsão nova. |
| 6.9 | **Contexto IA** | Workflow roda de hora em hora (`contexto-ia.yml:42`), não "a cada 10 min" como `contexto-ia.md:30` diz. |

---

## 7. Segurança parcial

| # | Item | Real |
|---|---|---|
| 7.1 | **MFA/2FA** ("MFA & Passkeys", `INVENTARIO:79`; `SECURITY_AUDIT_REPORT.md:8`) | Cadastro funciona (`TwoFactorSetup.tsx:80`), mas o **login nunca exige o segundo fator**: nenhum `getAuthenticatorAssuranceLevel`/`mfa.challenge` no fluxo (`src/pages/Auth.tsx:62-70`); `MFAVerify`/`MFAEnroll` não são importados; `SecurityOverviewPanel.tsx:75` fixa `mfaEnabled = false`. |
| 7.2 | **Passkeys/WebAuthn** | Só cadastro (`PasskeyManager`); `authenticateWithPasskey` (`useWebAuthn.tsx:213-320`) sem chamador, sem verificação de assinatura, sem criação de sessão, com embed `profiles!webauthn_credentials_user_id_fkey` que não existe (`Relationships: []`). Sem edge function de verificação. |
| 7.3 | **Matriz de permissões** (`PermissionMatrix`, `role_permissions`, `has_permission`) | Editável, mas `PermissionGate` não é importado por nenhuma página e nenhuma policy chama `has_permission()`: alterar a matriz não tem efeito. |
| 7.4 | **Geo-blocking / IP / lockout** | Só valem na tela de login e **liberam em caso de erro** (`authUtils.ts:28-31` → `{allowed:true}`); IP vem do browser (`api.ipify.org`) e é confiado pela function (`validate-login/index.ts:84-100`); quem chama o Auth do Supabase direto não passa por nada; `geo_blocking_settings` (modo whitelist/blacklist) e `geo_blocking_rules` não são lidas por nenhuma function (só `geo_access_rules`, sempre como whitelist); geolocalização por `http://ip-api.com` sem TLS (`:39`). |
| 7.5 | **Gestão de sessões** ("Encerrar sessão", "desconectar outros") | `useDeviceSessions.ts:96,112` grava `is_current: true` em todas; `revokeAllOtherSessions` apaga só `is_current=false` (nunca existe); nenhum `signOut({scope:'others'})` nem revogação de token. Conta de "sessões ativas" inflada. |
| 7.6 | **Functions sem auth no código** (gateway aceita anon key) | `scheduled-reports` (userId do body), `new-device-alert` (e-mail do body), `external-db-bridge` (opcional), `check-rate-limit`, `smart-carrier-selection` (opcional), `db-health-weekly-report`, `bitrix24-integration`, `whatsapp-notification`, `accuracy-weekly-digest` (só o preview autentica; o envio em massa não), `execute-protocol` (qualquer logado, sem papel). |
| 7.7 | **HMAC opcional** | `nexus-webhook-receiver/index.ts:34`: só exige assinatura se `NEXUS_WEBHOOK_SECRET` existir, apesar do comentário "fail-closed". |
| 7.8 | **CORS "restritivo em produção"** (`PLANO:71` ✅; ADR 0002) | `_shared/cors.ts:17` usa `*` sem `ALLOWED_ORIGINS`; **27 das 43 functions nem usam `cors.ts`** (24 com `*` próprio, 3 com o `cors` do supabase-js, também `*`). `ALLOWED_ORIGINS` em produção: **NÃO VERIFICADO**. |
| 7.9 | **Rate limiting "em edge functions"** (`PLANO:68` ✅; `SECURITY_AUDIT_REPORT.md:10`) | 11 de 43 functions. |
| 7.10 | **Timeout/circuit breaker "em todas as chamadas externas"** (ADR 0005) | Breaker em 8 functions; **14 fazem `fetch` externo sem breaker** (`ai-logistics-assistant`, `bitrix24-integration`, `check-password-breach`, `db-health-weekly-report`, `geocode-address`, `get-weather-data`, `ingest-biosync`, `log-security-event`, `new-device-alert`, `normalize-freight-response`, `resend-email`, `validate-login`, `webhook-status`, `whatsapp-notification`); `safeFetch`/allow-list só em `geocode-address` e `get-weather-data`; estado do breaker não persiste entre invocações. |
| 7.11 | **`check-password-breach` fail-open** | HIBP com erro HTTP → `{pwned:false}` 200 (`index.ts:56-62`); fetch sem timeout. |
| 7.12 | **`health` não checa auth** | `auth.getSession()` é local e sempre "healthy" (`health/index.ts:39-45`). |
| 7.13 | **Heartbeat não sonda nada** | `record_heartbeat()` só faz `UPDATE … SET last_check=now()` para 4 serviços (`20260822190000_*.sql:12-15`); `SystemHealthWidget` exibe isso como saúde. |
| 7.14 | **`mcp_exec` / `mcp_exec_many`** | RPCs que executam SQL arbitrário existem no banco (`types.ts:6375-6379`) sem migration no repo; snapshot `supabase/schema-manifest.json` indica EXECUTE só para `postgres`/`service_role`, mas o estado atual é **NÃO VERIFICADO**. |
| 7.15 | **SECURITY DEFINER sem justificativa** (ADR 0014 exige comentário e "falha no PR review") | ~27 funções DEFINER criadas depois de 2026-07-12 sem o cabeçalho (`20261117120000_*.sql`, `20261118220000_*.sql`…); nenhum script verifica. ADR ainda cita papel `moderator` inexistente (`app_role = admin|user`). |
| 7.16 | **`user_ranks` legível por anon** | Policy `USING(true)` sem `TO authenticated` (`20260517191652_*.sql:18`); as 5 tabelas públicas da auditoria de 02/09 foram corrigidas só em parte. |
| 7.17 | **Validação de payload** | `validate_payload_schema` sempre retorna TRUE (`20260519171908_*.sql:43-46`). |
| 7.18 | **`.env` versionado** | `git ls-files .env` → rastreado; `.gitignore` não cobre (`prod-readiness.md` já bloqueava). |
| 7.19 | **CSP** | `unsafe-inline` ×2 e `unsafe-eval` em `index.html`; dns-prefetch/preconnect para projeto morto `uwbpzfcysppwikfpnzok.supabase.co` (`index.html:37-38`). |
| 7.20 | **Login social** | `SocialLoginButtons.tsx:14` usa wrapper `lovable.auth` (delega ao Supabase — funciona), mas `@lovable.dev/cloud-auth-js` segue em `package.json:53` sem uso. |

---

## 8. Gamificação

| # | Item | Real |
|---|---|---|
| 8.1 | **Streak de dias consecutivos** (`README.md:25`, `DOCUMENTATION.md:82`) | `authService.updateStreak` (`src/services/api/authService.ts:39-51`) só grava `last_activity_date`; RPC `update_user_streak` teve EXECUTE revogado de `authenticated` e nada mais incrementa `streak_days`; Header e Ranking exibem/ordenam por um valor que nunca sobe. |
| 8.2 | **Conquistas no ranking** | `Ranking.tsx:111` `achievements: 0 // Simplified for now`. |
| 8.3 | **XP pelo front** | `add_user_xp` revogado (2.13). |
| 8.4 | **Loja de recompensas / tabelas** | `rewards`, `reward_redemptions`, `user_gamification`, `task_gifts`, `rank_badges` não existem; UI usa `reward_items`/`reward_purchases` (funciona), mas `useGamification.ts:87,118` mantém `queryKey`s `rank_badges`/`task_gifts` obsoletas. |
| 8.5 | **Hook duplicado** | `src/hooks/gamification/useGamification.ts` e `.tsx` exportam `useGamification` com APIs diferentes; o Vite resolve o `.ts`, deixando o `.tsx` ambíguo/morto (`regras-dominio.md:36-39` já alerta). |
| 8.6 | **`GamificationPanel`, `BadgeCard`, `GiftCard`, `AchievementBadge`, `CompactAchievementBadge`** | Sem importador (mortos). |
| 8.7 | **Notificações de conquista "AchievementUnlockModal"** | Não existe (há `AchievementNotification`/`LevelUpModal`). |

---

## 9. Banco de dados

| # | Item | Real |
|---|---|---|
| 9.1 | **RPCs no banco sem nenhum consumidor** (nem `src/` nem functions) | `get_leaderboard`, `get_dashboard_metrics_fast`, `get_carrier_performance_fast` (ADR 0009 promete dashboards <5 ms via MV: **nenhuma tela usa**), `has_permission`, `validate_payload_schema`, `get_current_organization_id`, `calculate_level`, `xp_for_level`, `system_health_check`, `get_calibrated_tolerance`, `jsonb_recursive_merge`, `mcp_exec`, `mcp_exec_many` (+ as de manutenção chamadas só por cron). |
| 9.2 | **Tabelas sem nenhuma referência no código** | `account_lockouts`, `ai_chat_messages` (chat da IA não é persistido), `allowed_ips`, `business_rules_config`, `carrier_rankings`, `db_health_score_history`, `driver_badges`, `email_verification_tokens`, `freight_webhooks`, `notification_templates`, `organizations` (multi-tenant inexistente), `system_adr` (a tela usa `architecture_decisions`), `system_contract_schemas`. |
| 9.3 | **`performance_metrics` e `sla_alerts` nunca recebem dados** | `update_performance_metrics()` é stub (`RETURN NEW`, `20260519115243_*.sql:85-92`) sem trigger; nenhum INSERT em `src/`, functions ou migrations. Leitores: `useSLAMetrics` (Painel SLA, `FavoriteMetricsBar`), `useDashboardMetrics:155`, `Relatorios.tsx:70` → **sempre zero**. `useSLAMetrics.tsx:38` tem placeholder `Entity ${id}`. |
| 9.4 | **Realtime sem publication** | Subscriptions em `audit_logs` (`AuditTrailViewer.tsx:41`), `user_levels` (`Ranking.tsx:87`) e `coletas` (4 pontos) sem nenhuma migration que as adicione a `supabase_realtime` (coletas foi removida em 2026-04-03). Estado ao vivo **NÃO VERIFICADO**. |
| 9.5 | **Máquina de estados** | Sem `validate_status_transition`, tabela de transição ou trigger; única regra em `Despachos.tsx:95-99`, só nessa tela; `kanban_history` registra sem validar. |
| 9.6 | **Soft delete** | Ver 1.18; `useSoftDelete` e `useBulkActions` existem e **ninguém usa** (páginas fazem `update deleted_at` manual). |
| 9.7 | **Migrations sem rollback** | 0 de 244 com bloco `down`. |
| 9.8 | **Crons duplicados** | `nexus_heartbeat`, `nexus_notifications_ttl`, `nexus_telemetry_cleanup` (migrations `20260711*`, `cron_jobs_origem.json`) não estão na canônica `20260901000000` nem na sua lista de unschedule. |
| 9.9 | **`get_carrier_performance_stats`** | Retorna `tempo_medio_coleta_horas = NULL` fixo (`20260513190419_*.sql:57`). |
| 9.10 | **`freight_integration_mappings`** | Lida por `ConfiguracoesFrete`, nunca escrita; `carrier-webhook-receiver` não a usa. |
| 9.11 | **Schemas Zod "compartilhados"** (ADR 0003/0004) | `src/lib/schemas/common.ts` e cópia em `_shared/schemas/common.ts`: **nenhum arquivo os importa**; `deliverySchema` aceita status (`pendente`, `coletado`…) fora do enum `entrega_status`. |
| 9.12 | **`QUERY_KEYS` factory** (`INVENTARIO:14`) | Só `useDashboardMetrics` importa; 346 `queryKey` literais em `src/`. |
| 9.13 | **Seed** (ADR 0007) | `supabase/seed.sql:19-25` insere papéis `operator`/`finance`/`driver`, inválidos para `app_role` → o seed falha nesse INSERT. |
| 9.14 | **Dicionário de dados** | `docs/data/dicionario.md` gerado em 2026-08-31; coerente com `types.ts` hoje (101 tabelas), mas não é regenerado por automação. |
| 9.15 | **Aplicação de migration** | `docs/agentes/banco.md:12,48` diz que não existe workflow; existe `aplicar-migration.yml` (doc desatualizado). |

---

## 10. Observabilidade e SRE

| # | Item | Real |
|---|---|---|
| 10.1 | **SLOs** (`SLO.md`, `SRE_HANDBOOK.md`): uptime 99,9 %, P95 < 800 ms, P99 < 500 ms, RPO < 2 h, RTO < 4 h | Nenhum SLI, error budget ou alerta de burn rate para o produto; só SLO do gateway RTE (`src/lib/rodonaves/gatewaySLO.ts`) e do banco (`db_slo_daily`). |
| 10.2 | **Sentry / Web Vitals / tracing** | Sentry inicializa só com `VITE_SENTRY_DSN`, sem `browserTracingIntegration`; sem `web-vitals`; nenhuma function propaga `requestId` (campo existe em `logger.ts:11`, header em `cors.ts:11`, ninguém usa). |
| 10.3 | **`error_events`** (playbook manda investigar falhas de integração nela) | Só o front grava (`WidgetErrorBoundary.tsx:40`, `useTelemetry.ts:44`); nenhuma function de integração escreve. |
| 10.4 | **Alertas de rollback / razão WAL** (`AUDITORIA_BACKEND` sprint B) | Não existem; `xact_rollback` só como métrica. |
| 10.5 | **Runbooks apontam para infra errada** | `RUNBOOK_BACKUP.md:26-31` restaura via "Lovable Cloud → Connectors"; `INCIDENT_PLAYBOOK.md:7` manda checar Cloudflare (front é Vercel); `RUNBOOK_DB_PERFORMANCE.md:31` usa tool "via Lovable"; `DISASTER_RECOVERY.md` idem. Produção é Supabase `jvfhclubfpxrtrrazrgr` + Vercel. |
| 10.6 | **Teste de restore semestral, DR drill, chaos test** | Nenhum artefato, script ou registro. |
| 10.7 | **Staging** | Não existe (`AGENTS.md` confirma). |
| 10.8 | **9 functions de observabilidade "por pg_cron"** (`integracoes.md:69`) | Só 3 têm cron (`db-regression-monitor`, `db-health-snapshot`, `db-health-weekly-report`). |
| 10.9 | **Logging estruturado em 100 % das functions** (ADR 0002/0005) | 9 functions não usam `logger.ts` e não registram nada (`db-health-snapshot`, `db-health-weekly-report`, `db-regression-monitor`, `execute-protocol`, `get-mapbox-token`, `get-weather-data`, `health`, `lgpd-erase-user`, `resend-email`). |
| 10.10 | **Densidade compacta/confortável** (`INVENTARIO:87`) | `--base-font-size` definido mas nunca consumido; só `--ui-padding` em `.p-4`/`md:p-6`. |

---

## 11. Qualidade, testes e CI

| # | Item | Real |
|---|---|---|
| 11.1 | Testes que testam a si mesmos | `tests/fuzzing/edge-functions.spec.ts`, `tests/contracts/nexus-contracts.spec.ts`, `tests/load/backend-stress.spec.ts`, `tests/unit/modules-integrity.spec.ts` não importam código de produção nem fazem rede. |
| 11.2 | `test:rls` passa sem testar | `tests/security/rls-access.spec.ts:24-34,71-93` e `integrations-access.spec.ts` fazem `ctx.skip()` quando o Supabase não responde em 4 s; `ci-nexus.yml:49` sai verde. |
| 11.3 | Smoke Deno com `\|\| true` | `ci-nexus.yml:58`. |
| 11.4 | `.size-limit.json` | Nenhum script/workflow executa; CI usa `du -sk > 8192`. |
| 11.5 | Dependências circulares "proibidas via madge" (ADR 0006) | Só o script `check-circular`; nenhum workflow/hook o roda. |
| 11.6 | `max-lines 400` / complexidade 15 "rígidos" (ADR 0006, `ONBOARDING.md`) | `eslint.config.js:66-67` são `warn`; 58 arquivos > 400 linhas (fora `ui/`), topo `Envios.tsx` 1247. |
| 11.7 | Warning budget | 105 warnings congelados (97 do React Compiler "dívida congelada, não paga", `.warning-budget.json`). |
| 11.8 | E2E | Só `workflow_dispatch`; 2 specs. |
| 11.9 | CODEOWNERS | Não existe. |
| 11.10 | `tsconfig.app.json` (`strict:false`) morto; bloco `test:` morto em `vite.config.ts:101-105` (aponta `tests/test-utils.tsx` inexistente) | Confirmado. |
| 11.11 | 4 functions sem `index_test.ts` | `ai-logistics-assistant`, `db-health-snapshot`, `db-regression-monitor`, `scheduled-reports`. |
| 11.12 | Magic bytes nos importers | Ausente em `csvImporter.ts`/`excelImporter.ts`. |

---

## 12. Documentação aspiracional ou desatualizada

| Documento | Problema |
|---|---|
| `docs/INVENTARIO_FUNCIONALIDADES.md` | "10/10 — PERFEIÇÃO ATINGIDA"; tabela §7 marca como "✅ Produção" `useAIAssistant`, `useRodonaves`, `useShipping`, `useGamificationReal`, `useDashboardMetricsReal`, `useLogisticsCostsReal` (inexistentes), `public/sw.js` (inexistente); promete Gemini 2.0 Flash (código usa `gemini-3.6-flash`), roteirização Mapbox, sequências de teclado, clima/trânsito na IA, gatilho WhatsApp por atraso. |
| `docs/PLANO_MELHORIAS_2026.md` | "39/39 ✅": pelo menos 9 itens falsos ou divergentes (2.3, 2.7 sem uso, 4.5, 5.1, 5.2, 5.4, 6.1/6.2, 7.1 parcial, 7.4). |
| `docs/MELHORIAS.md`, `docs/MIGRATION-GUIDE.md`, `docs/README-CRUD.md` | Descrevem hooks, componentes, migrations e variáveis que não existem (seção 1); apontam para repo `adm01-debug/loggi-flow`. |
| `DOCUMENTATION.md`, `TEMPLATE_STRUCTURE.md` | 20+ arquivos citados inexistentes (1.13); i18n; caminhos planos `src/hooks/useX.tsx` (hoje em subpastas); "Edge Functions 10+", "Tabelas 25+". |
| `docs/PERFEICAO_10_10.md`, `docs/RELATORIO_PERFEICAO_FINAL.md`, `docs/SECURITY_AUDIT_REPORT.md` | Certificados "10/10" contraditos pelas auditorias de 08–09/2026 e por esta. |
| `docs/adr/` | Numeração duplicada 0001–0005 (dois arquivos cada); `README.md` lista 7 de 19; ADR 0009 cita "ADR 0023" inexistente; ADR 0014 cita papel `moderator`. |
| `docs/api/openapi.yaml` | Faltam 7 functions (`accuracy-meta-monitor`, `accuracy-weekly-digest`, `db-health-snapshot`, `db-health-weekly-report`, `db-regression-monitor`, `predict-delays-scheduled`, `secure-store`); "36 endpoints" ME (são 34); `evolution-whatsapp` como webhook público; `ai-logistics-assistant` "(Lovable AI)" quando usa Google direto. |
| `docs/ARCHITECTURE.md` | Cita `activity_logs`, `rewards`, hooks e testes inexistentes; "Edge Functions: previsão, push, webhooks". |
| `docs/INTEGRACAO_CONFIG.md` | Nomes de secrets errados (1.23); SPAs Bitrix divergentes; n8n; "Dezembro 2024". |
| `docs/agentes/*.md` | `banco.md` nega workflow de apply (existe); `contexto.yml` vs `contexto-ia.yml` (também em `AGENTS.md:103`); `github-ci.md` "6 workflows" (são 18); `integracoes.md:69` crons inexistentes; `regras-dominio.md:32,40-44` `entity_versions` e hooks Real. |
| `CHANGELOG.md` | Parado em 1.1.0 (2026-09-02) com ~48 PRs depois. |
| `docs/LGPD_COMPLIANCE.md`, `docs/INCIDENT_PLAYBOOK.md`, `docs/RUNBOOK_*.md`, `docs/DISASTER_RECOVERY.md`, `docs/SLO.md`, `docs/SRE_HANDBOOK.md` | Ver 1.19–1.21, 10.5. |
| `README.md` | Badges e clone apontam para `adm01-debug/loggi-flow`; "48 hooks / 30 páginas" (são 120+ / 78). |

---

## 13. Código morto (MORTO)

- **Sem nenhum importador:** `src/hooks/ai/useNexusSimulator.ts`, `src/hooks/security/useSelfHealing.ts`, `src/components/gamification/GamificationPanel.tsx`, `src/components/common/TiltCard.tsx`, `src/features/logistics/services/LogisticsService.ts`.
- **Só no barrel (ninguém importa por nome):** `useWhatsAppNotification`, `useEvolutionWhatsApp`, `useExternalDbBridge`, `useBitrixEntregaSync` (ação `update_deal`), `useSoftDelete`, `useBulkActions`, `useFeatureFlag(s)`, `usePushNotifications`, `useSLAAlerts`, `useMFA`; componentes `WelcomeModal`, `OnboardingChecklist`, `QuickQuoteWidget`, `AchievementBadge`, `CompactAchievementBadge`, `BadgeCard`, `GiftCard`, `DetailSheet`, `ExportButton`, `SearchInput`, `StatusBadge`, `EmptyStatePresets`, `ResponsiveTable`, `LoadingSpinner`, `MFAVerify`, `MFAEnroll`, `PermissionGate`, `RTEPickupActions`, `RTECepAutoFill`.
- **Bibliotecas sem consumidor:** `src/lib/rodonaves/{capabilities (isActionAvailable…), eventCodes (normalizeRTEEvent), freightHealth}`, `src/lib/schemas/common.ts`, `_shared/schemas/common.ts`, `_shared/service-wrapper.ts`.
- **Edge functions sem nenhum chamador (nem cron versionado):** `lgpd-erase-user`, `secure-store`, `get-weather-data`, `get-mapbox-token`, `ingest-biosync`, `health`; alcançáveis só por hooks mortos: `evolution-whatsapp`, `external-db-bridge`.
- **Dependências sem uso:** `@lovable.dev/cloud-auth-js`, `i18next`/`react-i18next` (uso nominal), `lovable-tagger` no build.

---

## 14. Itens de auditorias anteriores que continuam abertos

De `ESTADO_ATUAL.md` (08/2026), `docs/audit/2026-09-02_*` (22 dimensões), `docs/AUDITORIA_BACKEND_SENIOR_2026.md` e `docs/prod-readiness.md` (14/11), ainda abertos hoje:

- `useNexusSimulator`/`useSelfHealing` órfãos; 4 testes-espelho; crons `nexus_*` duplicados; `scheduled-reports` sem agendador; `LiveStatusBar` aleatório; `webhook-status` "Action not implemented"; `migrate-helper` sem fonte no repo.
- `user_ranks` legível por anon; policies de PII por papel; `entity_versions` sem uso; migrations sem `down`; state machine; magic bytes; `tsconfig.app.json`; `.env` versionado; CODEOWNERS; `size-limit` fora do CI; e2e fora do CI; smoke `|| true`; Sentry sem tracing/Web Vitals; `requestId` ausente; 2 `console.log` residuais (`src/utils/logger.ts:25`, `performance.ts:23`); god-pages; runbook de rollback.
- Bitrix sem auth/breaker/retry; alerta de rollback e WAL; SSRF allow-list só em 2 functions; SLO com burn alerts; chaos test; DR drill; CORS `*`.
- `prod-readiness` "BLOQUEADO": `.env` versionado; `entregas`/`coletas` sem ingestão automática.
- Decisão D5 (`achievements` 6 vs 26) sem registro; `INVENTARIO` "10/10" não reconciliado (R7).

Resolvidos desde então (para registro): zod `.errors`; eslint 9; coverage gate; `record_heartbeat` colunas; crons de `db-health-snapshot`/`accuracy-*`/`db-regression-monitor`/`predict-delays-scheduled`; `ingest-biosync` `Math.random`; `useDeliveryRoutes` ruído; `KPICard`/`Relatorios` aleatórios; anon key do teste RLS; LICENSE; PR template; `types-sync`; 5 functions fechadas; mocks de `AIFreightForecasting`/`MapIntelligenceOverlay`; `created_by` legado.

---

## 15. Não verificável nesta sessão (precisa do banco/serviços ao vivo)

Grants atuais de `mcp_exec*`, `add_user_xp`, `update_user_streak`; publication realtime; crons realmente ativos (`cron.job`); secrets (`ALLOWED_ORIGINS`, `SUPABASE_DB_URL`, `INTERNAL_FN_SECRET`, `NEXUS_WEBHOOK_SECRET`, `VITE_BITRIX24_WEBHOOK` na Vercel); existência de `migrate-helper` implantada; estado do GoTrue (MFA/leaked password); visibilidade do repo; CVEs atuais; se `fretes_internos`/`Ranking`/`RTECustomerManager` de fato erram em produção (inferido do schema).

---

## 16. Achados descartados pela verificação adversarial

- `rte_rollup_slo_daily` e `reconcile_pending_freights` **existem** no banco (`types.ts:6407,6391`) — retirado.
- Bucket `avatars` **é criado** em `20251215160229_*.sql:2-3` — retirado.
- ADR 0007 × seed: o seed gera 50 entregas em loop e 3 regras; só o INSERT de papéis falha (9.13 ajustado).
- `tests/integration/webhooks.spec.ts` importa `_shared/validate` — retirado da lista de testes-espelho.
- `/rastreamento/:id` é rota protegida (não pública) — ajustado em 4.
- `MapaRotas` time travel refaz a consulta de logs (não é só cosmético); as posições, sim, são inventadas — ajustado em 3.22.
- Login social via `lovable.auth` delega ao Supabase — rebaixado a resíduo (7.20).

---

*Gerado em 2026-11-20 sobre `main` @ `3a9fa6a`. Nada foi alterado em código, banco ou produção.*

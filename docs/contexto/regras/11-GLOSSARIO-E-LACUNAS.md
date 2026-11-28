# 11 · GLOSSÁRIO, DADOS DE REFERÊNCIA E LACUNAS

> Gerado automaticamente por AI Context Sync v1.3.2 · commit `285036298f` · branch `main` · 2026-11-27 00:35 UTC
> Não edite à mão — regras humanas vão em `manual/`.

## Glossário do domínio (entidades do sistema)

| Termo | Significado / valores | Tamanho | Origem |
|---|---|---|---|
| `account_lockouts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `achievements` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `ai_chat_messages` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `ai_delay_predictions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `alertas_custo` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `allowed_ips` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `architecture_decisions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `audit_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `audit_logs_y2026m07` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | types.ts |
| `audit_logs_y2026m08` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | types.ts |
| `audit_logs_y2026m09` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | types.ts |
| `audit_logs_y2026m10` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | types.ts |
| `audit_logs_y2026m11` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | types.ts |
| `audit_logs_y2026m12` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | types.ts |
| `audit_logs_y2027m01` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | types.ts |
| `audit_logs_y2027m02` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | types.ts |
| `audit_logs_y2027m03` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | types.ts |
| `audit_logs_y2027m04` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | types.ts |
| `audit_logs_y2027m05` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | types.ts |
| `audit_logs_y2027m06` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | types.ts |
| `audit_logs_y2027m07` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | types.ts |
| `automation_audit_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `bio_sync_alert_rules` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `bio_sync_telemetry` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `bitrix_sync_config` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `bitrix_sync_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `business_rules` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `business_rules_config` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `carrier_rankings` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `client_webhooks` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `clientes` | Customer records with delivery preferences | 16 colunas | migration |
| `coletas` | Pickup orders from suppliers | 31 colunas | migration |
| `comments` | Comentários em entidades (ocorrências, coletas, entregas, etc) | 7 colunas | migration |
| `conciliacao_itens_importados` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `conciliacoes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `contract_test_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `cotacoes_frete` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `cotacoes_multicanal` | _(sem COMMENT ON TABLE — significado não documentado)_ | 23 colunas | migration |
| `db_health_score_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `db_health_snapshots` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `db_slo_daily` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `delay_predictions_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `delivery_receipt_audit` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `driver_badges` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `email_verification_tokens` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `entregas` | Delivery orders to customers | 33 colunas | migration |
| `error_events` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `feature_flags` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `fornecedores` | Supplier records for pickups | 14 colunas | migration |
| `freight_decisions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `freight_integration_mappings` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `freight_selection_rules` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `freight_webhooks` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `fretes_internos` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `geo_access_rules` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `geo_blocked_attempts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `geo_blocking_rules` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `geo_blocking_settings` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | types.ts |
| `idempotency_keys` | _(sem COMMENT ON TABLE — significado não documentado)_ | 4 colunas | migration |
| `index_proposals` | _(sem COMMENT ON TABLE — significado não documentado)_ | 20 colunas | migration |
| `internal.query_baseline` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `ip_access_rules` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `kanban_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `known_devices` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `login_attempts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `logistica_reversa` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `mitigation_actions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `nexus_tactical_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `notificacoes_custo` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `notification_templates` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `notifications` | User notifications with realtime support | 10 colunas | migration |
| `ocorrencias` | Incident reports for pickups and deliveries | 10 colunas | migration |
| `organizations` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `password_reset_requests` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `performance_metrics` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `permissions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `prediction_accuracy_settings` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `profiles` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `push_subscriptions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `query_telemetry` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `rastreamento_alertas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `rastreamento_historico` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `rastreamento_historico_y2026m01` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | types.ts |
| `rastreamento_historico_y2026m02` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | types.ts |
| `rastreamento_historico_y2026m03` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | types.ts |
| `rastreamento_historico_y2026m04` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | types.ts |
| `rastreamento_historico_y2026m05` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | types.ts |
| `rastreamento_historico_y2026m06` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | types.ts |
| `rastreamento_historico_y2026m07` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | types.ts |
| `rastreamento_historico_y2026m08` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | types.ts |
| `rastreamento_historico_y2026m09` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | types.ts |
| `rastreamento_historico_y2026m10` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | types.ts |
| `rastreamento_historico_y2026m11` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | types.ts |
| `rastreamento_historico_y2026m12` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | types.ts |
| `rastreamento_historico_y2027m01` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | types.ts |
| `rastreamento_historico_y2027m02` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | types.ts |
| `rastreamento_historico_y2027m03` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | types.ts |
| `rastreamento_historico_y2027m04` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | types.ts |
| `rastreamento_historico_y2027m05` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | types.ts |
| `rastreamento_historico_y2027m06` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | types.ts |
| `rate_limit_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `remediation_actions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `reward_items` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `reward_purchases` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `reward_redemptions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `rewards` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `risk_zones` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `role_permissions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 4 colunas | migration |
| `rte_gateway_health` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `rte_slo_daily_snapshots` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `rte_slo_targets` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `rule_execution_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `scheduled_reports` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | types.ts |
| `security_events` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `sla_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `system_adr` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `system_contract_schemas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `system_heartbeat` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `system_integrity_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `tabelas_frete` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `telemetry_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `transportadora_rotas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `transportadoras` | _(sem COMMENT ON TABLE — significado não documentado)_ | 22 colunas | migration |
| `user_achievements` | _(sem COMMENT ON TABLE — significado não documentado)_ | 4 colunas | migration |
| `user_gamification` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `user_levels` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `user_notification_preferences` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `user_onboarding` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `user_panel_preferences` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `user_ranks` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `user_roles` | _(sem COMMENT ON TABLE — significado não documentado)_ | 4 colunas | migration |
| `user_sessions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `v_prediction_accuracy` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | types.ts |
| `v_prediction_accuracy_by_carrier` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | types.ts |
| `v_prediction_accuracy_daily` | _(sem COMMENT ON TABLE — significado não documentado)_ | 4 colunas | types.ts |
| `v_prediction_accuracy_daily_carrier` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | types.ts |
| `webauthn_challenges` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `webauthn_credentials` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `webhook_deliveries` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `webhook_events_processed` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `webhook_inbound_failures` | Etapa 288 - falha de webhook de entrada por receptor. Sem payload (LGPD). | 7 colunas | migration |
| `coleta_tipo` (enum) | lalamove, transportadora |  | banco |
| `coleta_status` (enum) | aguardando_liberacao, solicitada, em_transito, chegou_expedicao, conferencia_ok, divergencia, finalizada |  | banco |
| `entrega_status` (enum) | aguardando_producao, pronto_despacho, cotacao_frete, nf_emitida, despachado, em_transito, saiu_entrega, entregue, ocorrencia, finalizado |  | banco |
| `frete_tipo` (enum) | cif, fob, cortesia |  | banco |
| `app_role` (enum) | admin, user |  | banco |
| `frete_interno_status` (enum) | pendente, em_transito, entregue, atrasado, cancelado |  | banco |
| `notification_type` (enum) | info, success, warning, error, achievement |  | banco |
| `ColetaStatus` (TS) | aguardando_liberacao \| solicitada \| em_transito \| chegou_expedicao \| conferencia_ok \| divergencia \| finalizada |  | `src/components/coletas/types.ts` |
| `ColetaTipo` (TS) | lalamove \| transportadora |  | `src/components/coletas/types.ts` |
| `ConfirmType` (TS) | danger \| warning \| info \| success \| critical |  | `src/components/common/ConfirmDialog.tsx` |
| `EmptyStateVariant` (TS) | search \| data \| delivery \| notifications \| users \| error \| inbox \| calendar \| default \| location |  | `src/components/common/EmptyState.tsx` |
| `StatusType` (TS) | pending \| in_progress \| completed \| cancelled \| error \| warning \| aguardando_producao \| pronto_despacho \| despachado \| em_transito \| saiu_entrega \| entregue \| finalizado \| finalizada \| ocorrencia \| divergencia \| atrasado \| solicitada \| agendada \| coletada \| cancelada \| pendente \| ativo \| inativo |  | `src/components/common/statusHelpers.ts` |
| `WidgetSize` (TS) | small \| medium \| large \| full |  | `src/components/dashboard/DraggableDashboard.tsx` |
| `SituacaoCron` (TS) | falha \| atrasado \| sem_historico \| parado \| ok |  | `src/features/db-observability/cron-status.ts` |
| `RegressionSeverity` (TS) | critical \| warning \| ok |  | `src/features/db-observability/types/index.ts` |
| `CircuitState` (TS) | CLOSED \| OPEN \| HALF_OPEN |  | `src/features/incidents/types/index.ts` |
| `UIDensity` (TS) | compact \| standard \| comfortable |  | `src/features/preferences/types/index.ts` |
| `ThemeMode` (TS) | light \| dark \| system |  | `src/features/preferences/types/index.ts` |
| `TelemetrySeverity` (TS) | info \| warning \| error \| critical |  | `src/hooks/analytics/useTelemetry.ts` |
| `Density` (TS) | compact \| standard \| comfortable |  | `src/hooks/common/useDensity.ts` |
| `ImportStatus` (TS) | idle \| parsing \| validating \| importing \| complete \| error |  | `src/hooks/common/useImportData.ts` |
| `SortDirection` (TS) | asc \| desc |  | `src/hooks/common/useSorting.ts` |
| `TIPOS_NOTIFICACAO` (TS) | "info", "success", "warning", "error", "achievement", |  | `src/hooks/data/useNotificacoesPage.ts` |
| `BadgeTier` (TS) | bronze \| silver \| gold \| platinum \| diamond |  | `src/hooks/gamification/useGamification.ts` |
| `BadgeRarity` (TS) | common \| rare \| epic \| legendary |  | `src/hooks/gamification/useGamification.ts` |
| `EntityType` (TS) | coleta \| entrega \| ocorrencia \| frete |  | `src/hooks/logistics/useBusinessRules.tsx` |
| `TriggerEvent` (TS) | on_create \| on_update \| on_status_change \| low_performance \| high_cost |  | `src/hooks/logistics/useBusinessRules.tsx` |
| `ConditionOperator` (TS) | equals \| not_equals \| contains \| greater_than \| less_than \| is_empty \| is_not_empty \| below_threshold |  | `src/hooks/logistics/useBusinessRules.tsx` |
| `ActionType` (TS) | send_notification \| change_status \| send_email \| add_tag \| assign_user \| create_alert \| block_carrier |  | `src/hooks/logistics/useBusinessRules.tsx` |
| `FlowStep` (TS) | dados \| resultados \| comparar \| despachar |  | `src/hooks/logistics/useQuotationFlow.tsx` |
| `NotificationPermissionState` (TS) | default \| granted \| denied |  | `src/hooks/logistics/useSLANotifications.tsx` |
| `TrackingFilter` (TS) | all \| atrasados \| em_transito \| entregue \| pendentes |  | `src/hooks/logistics/useUnifiedTracking.tsx` |
| `MitigationStatus` (TS) | planejada \| em_execucao \| concluida \| cancelada |  | `src/hooks/predictions/useMitigationActions.ts` |
| `TIPOS_FRETE` (TS) | { value: "cif", label: "CIF - Frete por conta do remetente" }, { value: "fob", label: "FOB - Frete por conta do destinatário" }, { value: "cortesia", label: "Cortesia - Sem cobrança" }, |  | `src/lib/constants.ts` |
| `TIPOS_OCORRENCIA` (TS) | { value: "atraso", label: "Atraso na Entrega" }, { value: "avaria", label: "Avaria/Dano" }, { value: "extravio", label: "Extravio" }, { value: "endereco_incorreto", label: "Endereço Incorreto" }, { value: "ausente", label: "Destinatário Ausente" }, { value: "recusa", label: "Recusa de Recebimento" } … |  | `src/lib/constants.ts` |
| `TipoTransicao` (TS) | entrega \| coleta |  | `src/lib/statusTransitions.ts` |
| `MitigationPriority` (TS) | alta \| media \| baixa |  | `src/lib/predictions/mitigationRecommender.ts` |
| `RootCauseCategory` (TS) | clima \| transportadora \| distancia \| feriado \| demanda \| endereco \| documentacao \| outros |  | `src/lib/predictions/rootCauseAnalyzer.ts` |
| `RTEGateway` (TS) | quotation \| tracking \| pickup \| customer \| selfattendance \| dne \| payments \| unittocity |  | `src/lib/rodonaves/capabilities.ts` |
| `RTECapabilityStatus` (TS) | liberado \| bloqueado \| offline \| instavel \| nao_testado |  | `src/lib/rodonaves/capabilities.ts` |
| `RTEPhase` (TS) | coletado \| transferencia \| distribuicao \| no_destino \| em_rota \| entregue \| desconhecido |  | `src/lib/rodonaves/eventCodes.ts` |
| `RTEExceptionCategory` (TS) | tentativa \| recusa \| estabelecimento_fechado \| endereco_nao_localizado \| pessoa_nao_localizada \| aguardando_retirada \| avaria \| extravio \| reagendado \| devolucao \| parcial |  | `src/lib/rodonaves/eventCodes.ts` |
| `RTESeverity` (TS) | info \| atencao \| critico |  | `src/lib/rodonaves/eventCodes.ts` |
| `RTECodeSystem` (TS) | event \| step |  | `src/lib/rodonaves/eventCodes.ts` |
| `FreightAnomaly` (TS) | atrasado \| parado \| excecao |  | `src/lib/rodonaves/freightHealth.ts` |
| `SLOStatus` (TS) | ok \| atencao \| violado |  | `src/lib/rodonaves/gatewaySLO.ts` |
| `AlertSeverity` (TS) | info \| warning \| critical |  | `src/lib/rodonaves/sloAlerts.ts` |
| `CircuitState` (TS) | CLOSED = "CLOSED", // Normal operation OPEN = "OPEN", // Service is failing, stop requests HALF_OPEN = "HALF_OPEN" // Service might be back, try one request |  | `supabase/functions/_shared/circuitBreaker.ts` |
| `InvokeFunctionFailureReason` (TS) | config \| timeout \| network \| http |  | `supabase/functions/_shared/invokeFunction.ts` |
| `LogLevel` (TS) | INFO = 'INFO', WARN = 'WARN', ERROR = 'ERROR', DEBUG = 'DEBUG' |  | `supabase/functions/_shared/logger.ts` |
| `ChannelName` (TS) | email \| whatsapp |  | `supabase/functions/accuracy-meta-monitor/channelHealth.ts` |
| `ChannelStatus` (TS) | ok \| error \| throw \| unknown |  | `supabase/functions/accuracy-meta-monitor/channelHealth.ts` |
| `ActionKind` (TS) | skip_group \| skip_below_threshold \| skip_signature \| update \| insert |  | `supabase/functions/accuracy-meta-monitor/simulator.ts` |
| `HISTORY_ROLES` (TS) | "user", "assistant", "system" |  | `supabase/functions/ai-logistics-assistant/parse.ts` |
| `LalamoveRoute` (TS) | quotation \| create_order \| get_order \| cancel_order |  | `supabase/functions/lalamove-api/parse.ts` |
| `ALLOWED_METHODS` (TS) | "GET", "POST", "PUT" |  | `supabase/functions/lalamove-api/parse.ts` |
| `ALLOWED_PATHS` (TS) | "/quotations", "/orders", "/orders/{id}", "/orders/{id}/cancel", |  | `supabase/functions/lalamove-api/parse.ts` |
| `MelhorEnvioAmbiente` (TS) | producao \| sandbox |  | `supabase/functions/melhor-envio-api/ambiente.ts` |
| `ALLOWED_ACTIONS` (TS) | "create", "update", "delete", "list", "generate", |  | `supabase/functions/scheduled-reports/fields.ts` |
| `ALLOWED_ACTIONS` (TS) | "notify_status_change", "list_webhooks", |  | `supabase/functions/webhook-status/parse.ts` |

## Dados de referência (seed — planos, categorias, perfis fixos)

| Tabela | Colunas | Valores | Origem |
|---|---|---|---|
| `profiles` | `id, email, full_name, avatar_url, cargo` | `('00000000-0000-0000-0000-000000000001', 'admin@logiflow.com', 'Admin Master', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', 'Diretor de Logística'), ('00000000-0000-0000-0000-000000000002', 'operador1@logiflow.com', 'Carlos Operador', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos', 'Analista de Expedição'), ('00000000-0000-0000-0000-000000000003', 'financeiro@logiflow.com', ' …` | `supabase/seed.sql` |
| `user_roles` | `user_id, role` | `('00000000-0000-0000-0000-000000000001', 'admin'), ('00000000-0000-0000-0000-000000000002', 'operator'), ('00000000-0000-0000-0000-000000000003', 'finance'), ('00000000-0000-0000-0000-000000000004', 'driver') ON CONFLICT (user_id, role) DO NOTHING` | `supabase/seed.sql` |
| `transportadoras` | `id, razao_social, nome_fantasia, cnpj, homologada, api_disponivel, score_performance` | `(gen_random_uuid(), 'Lalamove Brasil LTDA', 'Lalamove', '12345678000101', true, true, 95), (gen_random_uuid(), 'Rodonaves Transportes e Encomendas', 'Rodonaves', '98765432000199', true, true, 92), (gen_random_uuid(), 'Correios - Empresa Brasileira de Correios e Telégrafos', 'Correios', '34028316000103', true, true, 85), (gen_random_uuid(), 'Loggi Tecnologia LTDA', 'Loggi', '12345678000102', true, …` | `supabase/seed.sql` |
| `entregas` | `id, cliente_id, transportadora_id, status, valor_frete, prazo_estimado, data_postagem, codigo_rastreio` | `( gen_random_uuid(), '00000000-0000-0000-0000-000000000005', (SELECT id FROM public.transportadoras OFFSET (i % 10) LIMIT 1), CASE WHEN i % 5 = 0 THEN 'pendente' WHEN i % 5 = 1 THEN 'em_transito' WHEN i % 5 = 2 THEN 'entregue' WHEN i % 5 = 3 THEN 'cancelado' ELSE 'devolvido' END, (random() * 500 + 50)::numeric(10,2), current_date + (random() * 10 + 1)::int * interval '1 day', current_date - (rando …` | `supabase/seed.sql` |
| `business_rules` | `name, description, is_active, rule_type` | `('Bloqueio Frete Caro', 'Bloquear cotações acima de R$ 500 sem aprovação gerente', true, 'validation'), ('Prioridade Rodonaves', 'Sugerir Rodonaves para cargas acima de 100kg', true, 'optimization'), ('Alerta Atraso', 'Notificar se entrega não for atualizada em 48h', true, 'notification') ON CONFLICT (name) DO NOTHING` | `supabase/seed.sql` |
| `ip_access_rules` | `ip_address, rule_type, note` | `('127.0.0.1', 'allow', 'Localhost access'), ('192.168.1.1', 'allow', 'Office network') ON CONFLICT (ip_address) DO NOTHING` | `supabase/seed.sql` |

## Auditoria de consistência (código × schema) — trate como NÃO VERIFICADO

> `status`: inclui estados só de UI/realtime (ex.: `uploading`, `SUBSCRIBED`) que nunca vão ao banco — confira o arquivo antes de concluir que falta valor no enum.

| Tipo | Problema | Onde |
|---|---|---|
| status | valor `elite` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:src/components/admin/DORAMetrics.tsx` |
| status | valor `JOINING` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/common/RealtimeBadge.tsx`<br>`compara:src/components/common/RealtimeStatus.tsx` |
| status | valor `SUBSCRIBED` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/common/RealtimeBadge.tsx`<br>`compara:src/components/common/RealtimeStatus.tsx`<br>`compara:src/hooks/data/useRealtime.tsx`<br>`compara:src/hooks/system/useNexusHealth.ts` |
| status | valor `current` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/common/Timeline.tsx` |
| status | valor `neutral` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/dashboard/KPICard.tsx` |
| status | valor `healthy` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/dashboard/LiveStatusBar.tsx`<br>`compara:src/utils/systemTester.ts`<br>`compara:supabase/functions/health/index.ts`<br>`escreve:src/hooks/system/useNexusHealth.ts` |
| status | valor `degraded` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/dashboard/LiveStatusBar.tsx`<br>`compara:src/components/dashboard/SystemHealthWidget.tsx` |
| status | valor `undefined` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/dashboard/LiveStatusBar.tsx` |
| status | valor `operational` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/dashboard/SystemHealthWidget.tsx`<br>`escreve:supabase/functions/nexus-auto-healing/index.ts` |
| status | valor `down` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/dashboard/SystemHealthWidget.tsx` |
| status | valor `online` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/ui/badge.tsx`<br>`escreve:src/components/layout/SystemPulse.tsx`<br>`escreve:src/components/ui/badge.tsx` |
| status | valor `released` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/melhorenvio/MEEtiquetasPanel.tsx` |
| status | valor `posted` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/melhorenvio/MEEtiquetasPanel.tsx` |
| status | valor `delivered` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/melhorenvio/MEEtiquetasPanel.tsx` |
| status | valor `canceled` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/melhorenvio/MEEtiquetasPanel.tsx` |
| status | valor `read` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/predictions/AccuracyMetaAuditPanel.tsx` |
| status | valor `unread` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/predictions/AccuracyMetaAuditPanel.tsx` |
| status | valor `purchased` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/rewards/RewardPurchaseHistory.tsx` |
| status | valor `verified` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/security/TwoFactorSetup.tsx`<br>`compara:src/hooks/auth/useMFA.ts`<br>`compara:src/pages/Auth.tsx` |
| status | valor `none` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/ui/avatar.tsx`<br>`escreve:src/components/ui/avatar.tsx` |
| status | valor `measured` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/features/db-observability/hooks/useIndexProposals.ts` |
| status | valor `investigating` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:src/features/incidents/types/index.ts` |
| status | valor `falhou` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/analytics/useDashboardMetrics.tsx`<br>`compara:src/pages/DashboardCotacoes.tsx` |
| status | valor `Status` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:src/hooks/common/useExport.tsx`<br>`escreve:src/hooks/security/useAuditLogs.tsx`<br>`escreve:src/hooks/security/useEntityHistory.tsx` |
| status | valor `CHANNEL_ERROR` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/data/useRealtime.tsx` |
| status | valor `TIMED_OUT` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/data/useRealtime.tsx` |
| status | valor `deleted_at_set` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:src/hooks/data/useSoftDelete.ts` |
| status | valor `exceeded` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/logistics/useCostAlerts.tsx` |
| status | valor `connected` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/security/useIntegrationValidation.tsx`<br>`compara:src/pages/Configuracoes.tsx`<br>`escreve:src/hooks/security/useIntegrationValidation.tsx`<br>`escreve:src/pages/Configuracoes.tsx` |
| status | valor `not_configured` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:src/hooks/security/useIntegrationValidation.tsx` |
| status | valor `configured` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/security/useIntegrationValidation.tsx` |
| status | valor `above` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/pages/Analytics.tsx` |
| status | valor `below` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/pages/Analytics.tsx` |
| status | valor `sem_match` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/pages/ConciliacaoAutomatica.tsx`<br>`escreve:src/pages/ConciliacaoAutomatica.tsx` |
| status | valor `Ativo` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:src/pages/IntegracaoBitrix.tsx` |
| status | valor `SUCCESS` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/pages/IntegracaoBitrix.tsx` |
| status | valor `aprovado` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:src/pages/LogisticaReversa.tsx` |
| status | valor `recebido` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/pages/LogisticaReversa.tsx`<br>`escreve:src/pages/LogisticaReversa.tsx` |
| status | valor `PASS` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/utils/systemTester.ts` |
| status | valor `sent` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/accuracy-weekly-digest/index.ts`<br>`escreve:supabase/functions/accuracy-weekly-digest/index.ts` |
| status | valor `empty` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/accuracy-weekly-digest/index.ts`<br>`escreve:supabase/functions/accuracy-weekly-digest/index.ts` |
| status | valor `very_slow` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/external-db-bridge/index.ts` |
| status | valor `slow` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/external-db-bridge/index.ts` |
| status | valor `unhealthy` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/health-check/index.ts`<br>`escreve:supabase/functions/health/index.ts` |
| status | valor `critical_failure` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/health/index.ts` |
| status | valor `COMPLETED` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/lalamove-webhook/index.ts`<br>`escreve:supabase/functions/lalamove-webhook/index_test.ts` |
| status | valor `no_options` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/smart-carrier-selection/index.ts` |
| status | valor `scan` para `step` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/coletas/PickupConference.tsx` |
| status | valor `scanning` para `step` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/dashboard/BiometricConsentModal.tsx` |
| status | valor `start` para `step` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/security/MFAEnroll.tsx` |
| status | valor `installed` para `state` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/pwa/UpdatePrompt.tsx` |
| status | valor `expanded` para `state` usado no código não existe em nenhum enum do banco/TS | `escreve:src/components/ui/sidebar.tsx` |
| status | valor `collapsed` para `state` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/ui/sidebar.tsx` |
| status | valor `suspended` para `state` usado no código não existe em nenhum enum do banco/TS | `compara:src/utils/celebrationSounds.ts` |
| status | valor `not_implemented` para `ocr_status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/ocr-receipt-processor/index.ts` |
| status | valor `succeeded` para `last_status` usado no código não existe em nenhum enum do banco/TS | `compara:src/features/db-observability/components/CronJobsCard.tsx` |
| status | valor `UF` para `estado` usado no código não existe em nenhum enum do banco/TS | `escreve:src/hooks/common/useExport.tsx` |
| status | valor `motorista_alocado` para `order_status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/lalamove-webhook/index.ts` |
| coluna | coluna `nome` usada no código não existe no schema de `entregas` |  |
| coluna | coluna `contato_whatsapp` usada no código não existe no schema de `transportadoras` |  |
| rls | `geo_blocking_rules`: acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/components/security/GeoBlockingPanel.tsx` |
| rls | `geo_blocking_settings`: acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/components/security/GeoBlockingPanel.tsx` |
| rls | `notificacoes_custo`: front faz UPDATE mas nenhuma política RLS permite UPDATE → vai falhar/retornar vazio para usuários | `src/hooks/logistics/useCostAlerts.tsx` |
| dinheiro | `internal.query_baseline.total_exec_time` guarda dinheiro em `double precision NOT NULL` (ponto flutuante) — arredondamento imprevisível; padrão é numeric |  |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `src/components/audit/AuditTrailViewer.tsx` |
| dinâmico | 4 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `src/hooks/common/useBulkActions.ts` |
| dinâmico | 2 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `src/hooks/data/useDocumentUpload.ts` |
| dinâmico | 2 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `src/hooks/data/useImageUpload.tsx` |
| dinâmico | 2 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `src/hooks/data/useSoftDelete.ts` |
| dinâmico | 2 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `src/pages/ImportacaoMassa.tsx` |
| dinâmico | 4 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `supabase/functions/external-db-bridge/index.ts` |
| segurança | função `reconcile_pending_freights` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/rollbacks/20261125154100_rollback_drop_reconcile_pending_freights.sql` |

## Lacunas — o que este contexto NÃO consegue responder (perguntas para o dono do negócio)

- Nenhuma regra manual em `manual/`: prazos, limites, exceções comerciais, quem aprova o quê — só o negócio sabe.
- `coletas.status` tem valores ['aguardando_liberacao', 'solicitada', 'em_transito', 'chegou_expedicao', 'conferencia_ok', 'divergencia', 'finalizada'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `entregas.status` tem valores ['aguardando_producao', 'pronto_despacho', 'cotacao_frete', 'nf_emitida', 'despachado', 'em_transito', 'saiu_entrega', 'entregue', 'ocorrencia', 'finalizado'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `fretes_internos.status` tem valores ['pendente', 'em_transito', 'entregue', 'atrasado', 'cancelado'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `reward_purchases.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `conciliacoes.status` tem valores ['arquivada', 'concluida', 'em_andamento', 'rascunho'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `conciliacao_itens_importados.status` tem valores ['conciliado', 'divergencia', 'ignorado', 'pendente'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `user_onboarding.current_step` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `password_reset_requests.status` tem valores ['approved', 'pending', 'rejected'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `reward_redemptions.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `cotacoes_multicanal.status` tem valores ['expirado', 'pendente', 'respondido', 'selecionado'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `webhook_deliveries.response_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `logistica_reversa.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `architecture_decisions.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `rastreamento_historico.order_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `freight_decisions.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `automation_audit_logs.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `bitrix_sync_logs.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `kanban_history.from_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `kanban_history.to_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `delivery_receipt_audit.upload_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `delivery_receipt_audit.ocr_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `system_heartbeat.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `remediation_actions.status` tem valores ['ignored', 'in_progress', 'pending', 'resolved'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `index_proposals.status` tem valores ['applied', 'approved', 'failed', 'proposed', 'rejected', 'reverted'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `mitigation_actions.status` tem valores ['cancelada', 'concluida', 'em_execucao', 'planejada'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `rte_gateway_health.http_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `rte_slo_daily_snapshots.status` tem valores ['atencao', 'ok', 'violado'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `webhook_inbound_failures.response_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `system_adr.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- 133/141 tabelas sem `COMMENT ON TABLE` — o significado de negócio não está no schema: `transportadoras`, `cotacoes_frete`, `profiles`, `user_roles`, `user_levels`, `achievements`, `user_achievements`, `tabelas_frete`, `alertas_custo`, `notificacoes_custo`, `rastreamento_alertas`, `fretes_internos` …

## Regras manuais presentes

_nenhuma — copie `manual/TEMPLATE-regras-de-negocio.md`_

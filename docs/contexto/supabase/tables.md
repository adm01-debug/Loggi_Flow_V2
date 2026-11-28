# Tabelas

Um arquivo por tabela em `tables/<schema>/<tabela>.md` (colunas, constraints, índices, RLS/policies, triggers, grants). Métricas de volume em `stats.md`.

| tabela | tipo | RLS | policies | colunas | realtime | comentário |
|---|---|---|---|---|---|---|
| [audit_tmp.cfg](tables/audit_tmp/cfg.md) | table | não | 0 | 2 | não |  |
| [audit_tmp.job_test](tables/audit_tmp/job_test.md) | table | não | 0 | 5 | não |  |
| [audit_tmp.load_log](tables/audit_tmp/load_log.md) | table | não | 0 | 5 | não |  |
| [audit_tmp.manifest](tables/audit_tmp/manifest.md) | table | não | 0 | 4 | não |  |
| [audit_tmp.req](tables/audit_tmp/req.md) | table | não | 0 | 3 | não |  |
| [audit_tmp.seed_backup](tables/audit_tmp/seed_backup.md) | table | não | 0 | 4 | não |  |
| [audit_tmp.sql](tables/audit_tmp/sql.md) | table | não | 0 | 2 | não |  |
| [internal.query_baseline](tables/internal/query_baseline.md) | table | não | 0 | 8 | não |  |
| [public.achievements](tables/public/achievements.md) | table | sim | 2 | 12 | não |  |
| [public.ai_chat_messages](tables/public/ai_chat_messages.md) | table | sim | 3 | 6 | não |  |
| [public.ai_delay_predictions](tables/public/ai_delay_predictions.md) | table | sim | 2 | 8 | não |  |
| [public.alertas_custo](tables/public/alertas_custo.md) | table | sim | 4 | 11 | não |  |
| [public.architecture_decisions](tables/public/architecture_decisions.md) | table | sim | 1 | 8 | não |  |
| [public.audit_logs](tables/public/audit_logs.md) | partitioned | sim | 4 | 13 | não |  |
| [public.audit_logs_y2026m07](tables/public/audit_logs_y2026m07.md) | table (partição) | sim | 2 | 13 | não |  |
| [public.audit_logs_y2026m08](tables/public/audit_logs_y2026m08.md) | table (partição) | sim | 2 | 13 | não |  |
| [public.audit_logs_y2026m09](tables/public/audit_logs_y2026m09.md) | table (partição) | sim | 2 | 13 | não |  |
| [public.audit_logs_y2026m10](tables/public/audit_logs_y2026m10.md) | table (partição) | sim | 2 | 13 | não |  |
| [public.audit_logs_y2026m11](tables/public/audit_logs_y2026m11.md) | table (partição) | sim | 2 | 13 | não |  |
| [public.audit_logs_y2026m12](tables/public/audit_logs_y2026m12.md) | table (partição) | sim | 2 | 13 | não |  |
| [public.audit_logs_y2027m01](tables/public/audit_logs_y2027m01.md) | table (partição) | sim | 2 | 13 | não |  |
| [public.audit_logs_y2027m02](tables/public/audit_logs_y2027m02.md) | table (partição) | sim | 2 | 13 | não |  |
| [public.audit_logs_y2027m03](tables/public/audit_logs_y2027m03.md) | table (partição) | sim | 2 | 13 | não |  |
| [public.audit_logs_y2027m04](tables/public/audit_logs_y2027m04.md) | table (partição) | sim | 2 | 13 | não |  |
| [public.audit_logs_y2027m05](tables/public/audit_logs_y2027m05.md) | table (partição) | sim | 2 | 13 | não |  |
| [public.audit_logs_y2027m06](tables/public/audit_logs_y2027m06.md) | table (partição) | sim | 2 | 13 | não |  |
| [public.audit_logs_y2027m07](tables/public/audit_logs_y2027m07.md) | table (partição) | sim | 2 | 13 | não |  |
| [public.automation_audit_logs](tables/public/automation_audit_logs.md) | table | sim | 2 | 10 | não |  |
| [public.bio_sync_alert_rules](tables/public/bio_sync_alert_rules.md) | table | sim | 2 | 9 | não |  |
| [public.bio_sync_telemetry](tables/public/bio_sync_telemetry.md) | table | sim | 2 | 10 | não |  |
| [public.bitrix_sync_config](tables/public/bitrix_sync_config.md) | table | sim | 1 | 12 | não |  |
| [public.bitrix_sync_logs](tables/public/bitrix_sync_logs.md) | table | sim | 1 | 7 | não |  |
| [public.business_rules](tables/public/business_rules.md) | table | sim | 2 | 12 | não |  |
| [public.business_rules_config](tables/public/business_rules_config.md) | table | sim | 2 | 5 | não |  |
| [public.carrier_rankings](tables/public/carrier_rankings.md) | table | sim | 1 | 9 | não |  |
| [public.client_webhooks](tables/public/client_webhooks.md) | table | sim | 4 | 9 | não |  |
| [public.clientes](tables/public/clientes.md) | table | sim | 4 | 16 | não | Customer records with delivery preferences |
| [public.coletas](tables/public/coletas.md) | table | sim | 4 | 31 | não | Pickup orders from suppliers |
| [public.comments](tables/public/comments.md) | table | sim | 4 | 7 | não | Comentários em entidades (ocorrências, coletas, entregas, etc) |
| [public.conciliacao_itens_importados](tables/public/conciliacao_itens_importados.md) | table | sim | 4 | 16 | não |  |
| [public.conciliacoes](tables/public/conciliacoes.md) | table | sim | 4 | 16 | não |  |
| [public.contract_test_logs](tables/public/contract_test_logs.md) | table | sim | 1 | 8 | não |  |
| [public.cotacoes_frete](tables/public/cotacoes_frete.md) | table | sim | 4 | 9 | não |  |
| [public.cotacoes_multicanal](tables/public/cotacoes_multicanal.md) | table | sim | 4 | 23 | sim |  |
| [public.db_health_score_history](tables/public/db_health_score_history.md) | table | sim | 1 | 10 | não |  |
| [public.db_health_snapshots](tables/public/db_health_snapshots.md) | table | sim | 1 | 9 | não |  |
| [public.db_slo_daily](tables/public/db_slo_daily.md) | table | sim | 1 | 8 | não |  |
| [public.delay_predictions_history](tables/public/delay_predictions_history.md) | table | sim | 3 | 16 | não |  |
| [public.delivery_receipt_audit](tables/public/delivery_receipt_audit.md) | table | sim | 2 | 11 | não |  |
| [public.entregas](tables/public/entregas.md) | table | sim | 4 | 33 | sim | Delivery orders to customers |
| [public.error_events](tables/public/error_events.md) | table | sim | 2 | 7 | não |  |
| [public.feature_flags](tables/public/feature_flags.md) | table | sim | 2 | 7 | não |  |
| [public.fornecedores](tables/public/fornecedores.md) | table | sim | 4 | 14 | não | Supplier records for pickups |
| [public.freight_decisions](tables/public/freight_decisions.md) | table | sim | 2 | 10 | não |  |
| [public.freight_integration_mappings](tables/public/freight_integration_mappings.md) | table | sim | 2 | 6 | não |  |
| [public.freight_selection_rules](tables/public/freight_selection_rules.md) | table | sim | 2 | 10 | não |  |
| [public.freight_webhooks](tables/public/freight_webhooks.md) | table | sim | 1 | 9 | não |  |
| [public.fretes_internos](tables/public/fretes_internos.md) | table | sim | 6 | 14 | não |  |
| [public.geo_access_rules](tables/public/geo_access_rules.md) | table | sim | 1 | 6 | não |  |
| [public.geo_blocked_attempts](tables/public/geo_blocked_attempts.md) | table | sim | 2 | 7 | não |  |
| [public.geo_blocking_rules](tables/public/geo_blocking_rules.md) | table | sim | 2 | 9 | não |  |
| [public.geo_blocking_settings](tables/public/geo_blocking_settings.md) | table | sim | 2 | 5 | não |  |
| [public.idempotency_keys](tables/public/idempotency_keys.md) | table | sim | 1 | 4 | não |  |
| [public.index_proposals](tables/public/index_proposals.md) | table | sim | 3 | 20 | não |  |
| [public.ip_access_rules](tables/public/ip_access_rules.md) | table | sim | 2 | 8 | não |  |
| [public.kanban_history](tables/public/kanban_history.md) | table | sim | 2 | 7 | não |  |
| [public.known_devices](tables/public/known_devices.md) | table | sim | 4 | 12 | não |  |
| [public.login_attempts](tables/public/login_attempts.md) | table | sim | 2 | 7 | não |  |
| [public.logistica_reversa](tables/public/logistica_reversa.md) | table | sim | 3 | 13 | não |  |
| [public.mitigation_actions](tables/public/mitigation_actions.md) | table | sim | 1 | 17 | não |  |
| [public.nexus_tactical_logs](tables/public/nexus_tactical_logs.md) | table | sim | 2 | 10 | sim |  |
| [public.notificacoes_custo](tables/public/notificacoes_custo.md) | table | sim | 2 | 9 | não |  |
| [public.notifications](tables/public/notifications.md) | table | sim | 5 | 10 | sim | User notifications with realtime support |
| [public.ocorrencias](tables/public/ocorrencias.md) | table | sim | 4 | 10 | não | Incident reports for pickups and deliveries |
| [public.organizations](tables/public/organizations.md) | table | sim | 2 | 5 | não |  |
| [public.password_reset_requests](tables/public/password_reset_requests.md) | table | sim | 2 | 9 | não |  |
| [public.performance_metrics](tables/public/performance_metrics.md) | table | sim | 2 | 13 | não |  |
| [public.permissions](tables/public/permissions.md) | table | sim | 2 | 6 | não |  |
| [public.prediction_accuracy_settings](tables/public/prediction_accuracy_settings.md) | table | sim | 1 | 11 | não |  |
| [public.profiles](tables/public/profiles.md) | table | sim | 3 | 8 | não |  |
| [public.push_subscriptions](tables/public/push_subscriptions.md) | table | sim | 1 | 9 | não |  |
| [public.query_telemetry](tables/public/query_telemetry.md) | table | sim | 3 | 13 | não |  |
| [public.rastreamento_alertas](tables/public/rastreamento_alertas.md) | table | sim | 5 | 11 | não |  |
| [public.rastreamento_historico](tables/public/rastreamento_historico.md) | partitioned | sim | 2 | 12 | não |  |
| [public.rastreamento_historico_y2026m01](tables/public/rastreamento_historico_y2026m01.md) | table (partição) | sim | 2 | 12 | não |  |
| [public.rastreamento_historico_y2026m02](tables/public/rastreamento_historico_y2026m02.md) | table (partição) | sim | 2 | 12 | não |  |
| [public.rastreamento_historico_y2026m03](tables/public/rastreamento_historico_y2026m03.md) | table (partição) | sim | 2 | 12 | não |  |
| [public.rastreamento_historico_y2026m04](tables/public/rastreamento_historico_y2026m04.md) | table (partição) | sim | 2 | 12 | não |  |
| [public.rastreamento_historico_y2026m05](tables/public/rastreamento_historico_y2026m05.md) | table (partição) | sim | 2 | 12 | não |  |
| [public.rastreamento_historico_y2026m06](tables/public/rastreamento_historico_y2026m06.md) | table (partição) | sim | 2 | 12 | não |  |
| [public.rastreamento_historico_y2026m07](tables/public/rastreamento_historico_y2026m07.md) | table (partição) | sim | 2 | 12 | não |  |
| [public.rastreamento_historico_y2026m08](tables/public/rastreamento_historico_y2026m08.md) | table (partição) | sim | 2 | 12 | não |  |
| [public.rastreamento_historico_y2026m09](tables/public/rastreamento_historico_y2026m09.md) | table (partição) | sim | 2 | 12 | não |  |
| [public.rastreamento_historico_y2026m10](tables/public/rastreamento_historico_y2026m10.md) | table (partição) | sim | 2 | 12 | não |  |
| [public.rastreamento_historico_y2026m11](tables/public/rastreamento_historico_y2026m11.md) | table (partição) | sim | 2 | 12 | não |  |
| [public.rastreamento_historico_y2026m12](tables/public/rastreamento_historico_y2026m12.md) | table (partição) | sim | 2 | 12 | não |  |
| [public.rastreamento_historico_y2027m01](tables/public/rastreamento_historico_y2027m01.md) | table (partição) | sim | 2 | 12 | não |  |
| [public.rastreamento_historico_y2027m02](tables/public/rastreamento_historico_y2027m02.md) | table (partição) | sim | 2 | 12 | não |  |
| [public.rastreamento_historico_y2027m03](tables/public/rastreamento_historico_y2027m03.md) | table (partição) | sim | 2 | 12 | não |  |
| [public.rastreamento_historico_y2027m04](tables/public/rastreamento_historico_y2027m04.md) | table (partição) | sim | 2 | 12 | não |  |
| [public.rastreamento_historico_y2027m05](tables/public/rastreamento_historico_y2027m05.md) | table (partição) | sim | 2 | 12 | não |  |
| [public.rastreamento_historico_y2027m06](tables/public/rastreamento_historico_y2027m06.md) | table (partição) | sim | 2 | 12 | não |  |
| [public.rate_limit_logs](tables/public/rate_limit_logs.md) | table | sim | 3 | 8 | não |  |
| [public.remediation_actions](tables/public/remediation_actions.md) | table | sim | 4 | 15 | não |  |
| [public.reward_items](tables/public/reward_items.md) | table | sim | 2 | 10 | não |  |
| [public.reward_purchases](tables/public/reward_purchases.md) | table | sim | 4 | 7 | não |  |
| [public.risk_zones](tables/public/risk_zones.md) | table | sim | 1 | 9 | sim |  |
| [public.role_permissions](tables/public/role_permissions.md) | table | sim | 2 | 4 | não |  |
| [public.rte_gateway_health](tables/public/rte_gateway_health.md) | table | sim | 2 | 8 | não |  |
| [public.rte_slo_daily_snapshots](tables/public/rte_slo_daily_snapshots.md) | table | sim | 4 | 14 | não |  |
| [public.rte_slo_targets](tables/public/rte_slo_targets.md) | table | sim | 4 | 7 | não |  |
| [public.rule_execution_logs](tables/public/rule_execution_logs.md) | table | sim | 2 | 10 | não |  |
| [public.scheduled_reports](tables/public/scheduled_reports.md) | table | sim | 4 | 15 | não |  |
| [public.security_events](tables/public/security_events.md) | table | sim | 3 | 9 | não |  |
| [public.sla_alerts](tables/public/sla_alerts.md) | table | sim | 2 | 7 | não |  |
| [public.system_heartbeat](tables/public/system_heartbeat.md) | table | sim | 1 | 6 | não |  |
| [public.system_integrity_logs](tables/public/system_integrity_logs.md) | table | sim | 1 | 9 | não |  |
| [public.tabelas_frete](tables/public/tabelas_frete.md) | table | sim | 4 | 12 | não |  |
| [public.telemetry_logs](tables/public/telemetry_logs.md) | table | sim | 2 | 10 | não |  |
| [public.transportadora_rotas](tables/public/transportadora_rotas.md) | table | sim | 4 | 17 | não |  |
| [public.transportadoras](tables/public/transportadoras.md) | table | sim | 4 | 22 | não |  |
| [public.user_achievements](tables/public/user_achievements.md) | table | sim | 2 | 4 | não |  |
| [public.user_levels](tables/public/user_levels.md) | table | sim | 2 | 12 | não |  |
| [public.user_notification_preferences](tables/public/user_notification_preferences.md) | table | sim | 3 | 13 | não |  |
| [public.user_onboarding](tables/public/user_onboarding.md) | table | sim | 3 | 8 | não |  |
| [public.user_panel_preferences](tables/public/user_panel_preferences.md) | table | sim | 3 | 8 | não |  |
| [public.user_ranks](tables/public/user_ranks.md) | table | sim | 1 | 7 | não |  |
| [public.user_roles](tables/public/user_roles.md) | table | sim | 4 | 4 | não |  |
| [public.user_sessions](tables/public/user_sessions.md) | table | sim | 5 | 12 | não |  |
| [public.webauthn_challenges](tables/public/webauthn_challenges.md) | table | sim | 2 | 6 | não |  |
| [public.webauthn_credentials](tables/public/webauthn_credentials.md) | table | sim | 4 | 10 | não |  |
| [public.webhook_deliveries](tables/public/webhook_deliveries.md) | table | sim | 2 | 8 | não |  |
| [public.webhook_events_processed](tables/public/webhook_events_processed.md) | table | sim | 2 | 5 | não |  |
| [public.webhook_inbound_failures](tables/public/webhook_inbound_failures.md) | table | sim | 2 | 7 | não | Etapa 288 - falha de webhook de entrada por receptor. Sem payload (LGPD). |

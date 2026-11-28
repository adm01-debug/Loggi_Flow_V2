# Grants


Roles da API: `anon` (sem login), `authenticated` (logado), `service_role` (bypass RLS). Grants de sistema (postgres, supabase_*) omitidos.

## Tabelas e views

| objeto | role | privilégios |
|---|---|---|
| public.achievements | anon | MAINTAIN, SELECT |
| public.achievements | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.achievements | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ai_chat_messages | anon | MAINTAIN, SELECT |
| public.ai_chat_messages | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.ai_chat_messages | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ai_delay_predictions | anon | MAINTAIN, SELECT |
| public.ai_delay_predictions | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.ai_delay_predictions | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.alertas_custo | anon | MAINTAIN, SELECT |
| public.alertas_custo | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.alertas_custo | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.architecture_decisions | anon | MAINTAIN, SELECT |
| public.architecture_decisions | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.architecture_decisions | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.audit_logs | anon | MAINTAIN, SELECT |
| public.audit_logs | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.audit_logs | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.audit_logs_y2026m07 | anon | MAINTAIN, SELECT |
| public.audit_logs_y2026m07 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.audit_logs_y2026m07 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.audit_logs_y2026m08 | anon | MAINTAIN, SELECT |
| public.audit_logs_y2026m08 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.audit_logs_y2026m08 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.audit_logs_y2026m09 | anon | MAINTAIN, SELECT |
| public.audit_logs_y2026m09 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.audit_logs_y2026m09 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.audit_logs_y2026m10 | anon | MAINTAIN, SELECT |
| public.audit_logs_y2026m10 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.audit_logs_y2026m10 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.audit_logs_y2026m11 | anon | MAINTAIN, SELECT |
| public.audit_logs_y2026m11 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.audit_logs_y2026m11 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.audit_logs_y2026m12 | anon | MAINTAIN, SELECT |
| public.audit_logs_y2026m12 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.audit_logs_y2026m12 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.audit_logs_y2027m01 | anon | MAINTAIN, SELECT |
| public.audit_logs_y2027m01 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.audit_logs_y2027m01 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.audit_logs_y2027m02 | anon | MAINTAIN, SELECT |
| public.audit_logs_y2027m02 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.audit_logs_y2027m02 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.audit_logs_y2027m03 | anon | MAINTAIN, SELECT |
| public.audit_logs_y2027m03 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.audit_logs_y2027m03 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.audit_logs_y2027m04 | anon | MAINTAIN, SELECT |
| public.audit_logs_y2027m04 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.audit_logs_y2027m04 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.audit_logs_y2027m05 | anon | MAINTAIN, SELECT |
| public.audit_logs_y2027m05 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.audit_logs_y2027m05 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.audit_logs_y2027m06 | anon | MAINTAIN, SELECT |
| public.audit_logs_y2027m06 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.audit_logs_y2027m06 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.audit_logs_y2027m07 | anon | MAINTAIN, SELECT |
| public.audit_logs_y2027m07 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.audit_logs_y2027m07 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.automation_audit_logs | anon | MAINTAIN, SELECT |
| public.automation_audit_logs | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.automation_audit_logs | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.bio_sync_alert_rules | anon | MAINTAIN, SELECT |
| public.bio_sync_alert_rules | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.bio_sync_alert_rules | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.bio_sync_telemetry | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.bio_sync_telemetry | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.bitrix_sync_config | anon | MAINTAIN, SELECT |
| public.bitrix_sync_config | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.bitrix_sync_config | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.bitrix_sync_logs | anon | MAINTAIN, SELECT |
| public.bitrix_sync_logs | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.bitrix_sync_logs | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.business_rules | anon | MAINTAIN, SELECT |
| public.business_rules | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.business_rules | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.business_rules_config | anon | MAINTAIN, SELECT |
| public.business_rules_config | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.business_rules_config | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.carrier_rankings | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.carrier_rankings | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.client_webhooks | anon | MAINTAIN, SELECT |
| public.client_webhooks | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.client_webhooks | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.clientes | anon | MAINTAIN, SELECT |
| public.clientes | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.clientes | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.coletas | anon | MAINTAIN, SELECT |
| public.coletas | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.coletas | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.comments | anon | MAINTAIN, SELECT |
| public.comments | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.comments | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.conciliacao_itens_importados | anon | MAINTAIN, SELECT |
| public.conciliacao_itens_importados | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.conciliacao_itens_importados | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.conciliacoes | anon | MAINTAIN, SELECT |
| public.conciliacoes | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.conciliacoes | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contract_test_logs | anon | MAINTAIN, SELECT |
| public.contract_test_logs | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.contract_test_logs | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.cotacoes_frete | anon | MAINTAIN, SELECT |
| public.cotacoes_frete | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.cotacoes_frete | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.cotacoes_multicanal | anon | MAINTAIN, SELECT |
| public.cotacoes_multicanal | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.cotacoes_multicanal | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.db_health_score_history | anon | MAINTAIN, SELECT |
| public.db_health_score_history | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.db_health_score_history | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.db_health_snapshots | anon | MAINTAIN, SELECT |
| public.db_health_snapshots | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.db_health_snapshots | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.db_slo_daily | anon | MAINTAIN, SELECT |
| public.db_slo_daily | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.db_slo_daily | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.delay_predictions_history | anon | MAINTAIN, SELECT |
| public.delay_predictions_history | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.delay_predictions_history | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.delivery_receipt_audit | anon | MAINTAIN, SELECT |
| public.delivery_receipt_audit | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.delivery_receipt_audit | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.entregas | anon | MAINTAIN, SELECT |
| public.entregas | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.entregas | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.error_events | anon | MAINTAIN, SELECT |
| public.error_events | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.error_events | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.feature_flags | anon | MAINTAIN, SELECT |
| public.feature_flags | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.feature_flags | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.fornecedores | anon | MAINTAIN, SELECT |
| public.fornecedores | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.fornecedores | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.freight_decisions | anon | MAINTAIN, SELECT |
| public.freight_decisions | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.freight_decisions | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.freight_integration_mappings | anon | MAINTAIN, SELECT |
| public.freight_integration_mappings | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.freight_integration_mappings | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.freight_selection_rules | anon | MAINTAIN, SELECT |
| public.freight_selection_rules | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.freight_selection_rules | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.freight_webhooks | anon | MAINTAIN, SELECT |
| public.freight_webhooks | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.freight_webhooks | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.fretes_internos | anon | MAINTAIN, SELECT |
| public.fretes_internos | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.fretes_internos | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.geo_access_rules | anon | MAINTAIN, SELECT |
| public.geo_access_rules | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.geo_access_rules | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.geo_blocked_attempts | anon | MAINTAIN, SELECT |
| public.geo_blocked_attempts | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.geo_blocked_attempts | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.geo_blocking_rules | anon | MAINTAIN, SELECT |
| public.geo_blocking_rules | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.geo_blocking_rules | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.geo_blocking_settings | anon | MAINTAIN, SELECT |
| public.geo_blocking_settings | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.geo_blocking_settings | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.idempotency_keys | anon | MAINTAIN, SELECT |
| public.idempotency_keys | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.idempotency_keys | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.index_proposals | anon | MAINTAIN, SELECT |
| public.index_proposals | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.index_proposals | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ip_access_rules | anon | MAINTAIN, SELECT |
| public.ip_access_rules | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.ip_access_rules | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.kanban_history | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.kanban_history | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.known_devices | anon | MAINTAIN, SELECT |
| public.known_devices | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.known_devices | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.login_attempts | anon | MAINTAIN, SELECT |
| public.login_attempts | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.login_attempts | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.logistica_reversa | anon | MAINTAIN, SELECT |
| public.logistica_reversa | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.logistica_reversa | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.mitigation_actions | anon | MAINTAIN, SELECT |
| public.mitigation_actions | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.mitigation_actions | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.nexus_tactical_logs | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.nexus_tactical_logs | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.notificacoes_custo | anon | MAINTAIN, SELECT |
| public.notificacoes_custo | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.notificacoes_custo | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.notifications | anon | MAINTAIN, SELECT |
| public.notifications | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.notifications | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ocorrencias | anon | MAINTAIN, SELECT |
| public.ocorrencias | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.ocorrencias | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.organizations | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.organizations | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.password_reset_requests | anon | INSERT, MAINTAIN, SELECT |
| public.password_reset_requests | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.password_reset_requests | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.performance_metrics | anon | MAINTAIN, SELECT |
| public.performance_metrics | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.performance_metrics | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.permissions | anon | MAINTAIN, SELECT |
| public.permissions | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.permissions | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.prediction_accuracy_settings | anon | MAINTAIN, SELECT |
| public.prediction_accuracy_settings | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.prediction_accuracy_settings | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.profiles | anon | MAINTAIN, SELECT |
| public.profiles | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.profiles | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.push_subscriptions | anon | MAINTAIN, SELECT |
| public.push_subscriptions | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.push_subscriptions | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.query_telemetry | anon | MAINTAIN, SELECT |
| public.query_telemetry | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.query_telemetry | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_alertas | anon | MAINTAIN, SELECT |
| public.rastreamento_alertas | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_alertas | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico | anon | MAINTAIN, SELECT |
| public.rastreamento_historico | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico_y2026m01 | anon | MAINTAIN, SELECT |
| public.rastreamento_historico_y2026m01 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico_y2026m01 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico_y2026m02 | anon | MAINTAIN, SELECT |
| public.rastreamento_historico_y2026m02 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico_y2026m02 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico_y2026m03 | anon | MAINTAIN, SELECT |
| public.rastreamento_historico_y2026m03 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico_y2026m03 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico_y2026m04 | anon | MAINTAIN, SELECT |
| public.rastreamento_historico_y2026m04 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico_y2026m04 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico_y2026m05 | anon | MAINTAIN, SELECT |
| public.rastreamento_historico_y2026m05 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico_y2026m05 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico_y2026m06 | anon | MAINTAIN, SELECT |
| public.rastreamento_historico_y2026m06 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico_y2026m06 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico_y2026m07 | anon | MAINTAIN, SELECT |
| public.rastreamento_historico_y2026m07 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico_y2026m07 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico_y2026m08 | anon | MAINTAIN, SELECT |
| public.rastreamento_historico_y2026m08 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico_y2026m08 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico_y2026m09 | anon | MAINTAIN, SELECT |
| public.rastreamento_historico_y2026m09 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico_y2026m09 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico_y2026m10 | anon | MAINTAIN, SELECT |
| public.rastreamento_historico_y2026m10 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico_y2026m10 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico_y2026m11 | anon | MAINTAIN, SELECT |
| public.rastreamento_historico_y2026m11 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico_y2026m11 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico_y2026m12 | anon | MAINTAIN, SELECT |
| public.rastreamento_historico_y2026m12 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico_y2026m12 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico_y2027m01 | anon | MAINTAIN, SELECT |
| public.rastreamento_historico_y2027m01 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico_y2027m01 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico_y2027m02 | anon | MAINTAIN, SELECT |
| public.rastreamento_historico_y2027m02 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico_y2027m02 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico_y2027m03 | anon | MAINTAIN, SELECT |
| public.rastreamento_historico_y2027m03 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico_y2027m03 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico_y2027m04 | anon | MAINTAIN, SELECT |
| public.rastreamento_historico_y2027m04 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico_y2027m04 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico_y2027m05 | anon | MAINTAIN, SELECT |
| public.rastreamento_historico_y2027m05 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico_y2027m05 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rastreamento_historico_y2027m06 | anon | MAINTAIN, SELECT |
| public.rastreamento_historico_y2027m06 | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rastreamento_historico_y2027m06 | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rate_limit_logs | anon | MAINTAIN, SELECT |
| public.rate_limit_logs | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rate_limit_logs | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.remediation_actions | anon | MAINTAIN, SELECT |
| public.remediation_actions | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.remediation_actions | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.reward_items | anon | MAINTAIN, SELECT |
| public.reward_items | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.reward_items | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.reward_purchases | anon | MAINTAIN, SELECT |
| public.reward_purchases | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.reward_purchases | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.risk_zones | anon | MAINTAIN, SELECT |
| public.risk_zones | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.risk_zones | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.role_permissions | anon | MAINTAIN, SELECT |
| public.role_permissions | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.role_permissions | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rte_gateway_health | anon | MAINTAIN, SELECT |
| public.rte_gateway_health | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rte_gateway_health | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rte_slo_daily_snapshots | anon | MAINTAIN, SELECT |
| public.rte_slo_daily_snapshots | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rte_slo_daily_snapshots | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rte_slo_targets | anon | MAINTAIN, SELECT |
| public.rte_slo_targets | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rte_slo_targets | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rule_execution_logs | anon | MAINTAIN, SELECT |
| public.rule_execution_logs | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.rule_execution_logs | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.scheduled_reports | anon | MAINTAIN, SELECT |
| public.scheduled_reports | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.scheduled_reports | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.security_events | anon | MAINTAIN, SELECT |
| public.security_events | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.security_events | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sla_alerts | anon | MAINTAIN, SELECT |
| public.sla_alerts | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.sla_alerts | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.system_heartbeat | anon | MAINTAIN, SELECT |
| public.system_heartbeat | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.system_heartbeat | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.system_integrity_logs | anon | MAINTAIN, SELECT |
| public.system_integrity_logs | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.system_integrity_logs | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.tabelas_frete | anon | MAINTAIN, SELECT |
| public.tabelas_frete | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.tabelas_frete | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.telemetry_logs | anon | MAINTAIN, SELECT |
| public.telemetry_logs | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.telemetry_logs | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.transportadora_rotas | anon | MAINTAIN, SELECT |
| public.transportadora_rotas | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.transportadora_rotas | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.transportadoras | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.transportadoras | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.user_achievements | anon | MAINTAIN, SELECT |
| public.user_achievements | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.user_achievements | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.user_levels | anon | MAINTAIN, SELECT |
| public.user_levels | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.user_levels | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.user_notification_preferences | anon | MAINTAIN, SELECT |
| public.user_notification_preferences | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.user_notification_preferences | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.user_onboarding | anon | MAINTAIN, SELECT |
| public.user_onboarding | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.user_onboarding | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.user_panel_preferences | anon | MAINTAIN, SELECT |
| public.user_panel_preferences | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.user_panel_preferences | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.user_ranks | anon | MAINTAIN, SELECT |
| public.user_ranks | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.user_ranks | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.user_roles | anon | MAINTAIN, SELECT |
| public.user_roles | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.user_roles | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.user_sessions | anon | MAINTAIN, SELECT |
| public.user_sessions | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.user_sessions | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_prediction_accuracy | anon | MAINTAIN, SELECT |
| public.v_prediction_accuracy | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.v_prediction_accuracy | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_prediction_accuracy_by_carrier | anon | MAINTAIN, SELECT |
| public.v_prediction_accuracy_by_carrier | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.v_prediction_accuracy_by_carrier | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_prediction_accuracy_daily | anon | MAINTAIN, SELECT |
| public.v_prediction_accuracy_daily | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.v_prediction_accuracy_daily | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_prediction_accuracy_daily_carrier | anon | MAINTAIN, SELECT |
| public.v_prediction_accuracy_daily_carrier | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.v_prediction_accuracy_daily_carrier | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.webauthn_challenges | anon | MAINTAIN, SELECT |
| public.webauthn_challenges | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.webauthn_challenges | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.webauthn_credentials | anon | MAINTAIN, SELECT |
| public.webauthn_credentials | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.webauthn_credentials | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.webhook_deliveries | anon | MAINTAIN, SELECT |
| public.webhook_deliveries | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.webhook_deliveries | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.webhook_events_processed | anon | MAINTAIN, SELECT |
| public.webhook_events_processed | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.webhook_events_processed | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.webhook_inbound_failures | anon | MAINTAIN, SELECT |
| public.webhook_inbound_failures | authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| public.webhook_inbound_failures | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| storage.bucket_lifecycle_states | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| storage.buckets | anon | DELETE, INSERT, SELECT, UPDATE |
| storage.buckets | authenticated | DELETE, INSERT, SELECT, UPDATE |
| storage.buckets | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| storage.buckets_analytics | anon | DELETE, INSERT, SELECT, UPDATE |
| storage.buckets_analytics | authenticated | DELETE, INSERT, SELECT, UPDATE |
| storage.buckets_analytics | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| storage.buckets_vectors | anon | SELECT |
| storage.buckets_vectors | authenticated | SELECT |
| storage.buckets_vectors | service_role | SELECT |
| storage.lifecycle_abandoned_artifacts | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| storage.objects | anon | DELETE, INSERT, SELECT, UPDATE |
| storage.objects | authenticated | DELETE, INSERT, SELECT, UPDATE |
| storage.objects | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| storage.s3_multipart_uploads | anon | SELECT |
| storage.s3_multipart_uploads | authenticated | SELECT |
| storage.s3_multipart_uploads | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| storage.s3_multipart_uploads_parts | anon | SELECT |
| storage.s3_multipart_uploads_parts | authenticated | SELECT |
| storage.s3_multipart_uploads_parts | service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| storage.vector_indexes | anon | SELECT |
| storage.vector_indexes | authenticated | SELECT |
| storage.vector_indexes | service_role | SELECT |


## Colunas (grants parciais)

_nenhum_


## Sequences (roles da API)

| sequence | role | privilégios |
|---|---|---|
| public.coleta_seq | anon | USAGE, SELECT, UPDATE |
| public.coleta_seq | authenticated | USAGE, SELECT, UPDATE |
| public.coleta_seq | service_role | USAGE, SELECT, UPDATE |
| public.entrega_seq | anon | USAGE, SELECT, UPDATE |
| public.entrega_seq | authenticated | USAGE, SELECT, UPDATE |
| public.entrega_seq | service_role | USAGE, SELECT, UPDATE |


## Default privileges (aplicam-se a objetos NOVOS)

| schema | owner | tipo | ACL |
|---|---|---|---|
| auth | supabase_auth_admin | functions | postgres=X/supabase_auth_admin, dashboard_user=X/supabase_auth_admin |
| auth | supabase_auth_admin | sequences | postgres=rwU/supabase_auth_admin, dashboard_user=rwU/supabase_auth_admin |
| auth | supabase_auth_admin | tables | postgres=arwdDxtm/supabase_auth_admin, dashboard_user=arwdDxtm/supabase_auth_admin |
| cron | supabase_admin | functions | postgres=X*/supabase_admin |
| cron | supabase_admin | sequences | postgres=r*w*U*/supabase_admin |
| cron | supabase_admin | tables | postgres=a*r*w*d*D*x*t*m*/supabase_admin |
| extensions | supabase_admin | functions | postgres=X*/supabase_admin |
| extensions | supabase_admin | sequences | postgres=r*w*U*/supabase_admin |
| extensions | supabase_admin | tables | postgres=a*r*w*d*D*x*t*m*/supabase_admin |
| graphql | supabase_admin | functions | postgres=X/supabase_admin, anon=X/supabase_admin, authenticated=X/supabase_admin, service_role=X/supabase_admin |
| graphql | supabase_admin | sequences | postgres=rwU/supabase_admin, anon=rwU/supabase_admin, authenticated=rwU/supabase_admin, service_role=rwU/supabase_admin |
| graphql | supabase_admin | tables | postgres=arwdDxtm/supabase_admin, anon=arwdDxtm/supabase_admin, authenticated=arwdDxtm/supabase_admin, service_role=arwdDxtm/supabase_admin |
| graphql_public | supabase_admin | functions | postgres=X/supabase_admin, anon=X/supabase_admin, authenticated=X/supabase_admin, service_role=X/supabase_admin |
| graphql_public | supabase_admin | sequences | postgres=rwU/supabase_admin, anon=rwU/supabase_admin, authenticated=rwU/supabase_admin, service_role=rwU/supabase_admin |
| graphql_public | supabase_admin | tables | postgres=arwdDxtm/supabase_admin, anon=arwdDxtm/supabase_admin, authenticated=arwdDxtm/supabase_admin, service_role=arwdDxtm/supabase_admin |
| public | postgres | functions | postgres=X/postgres, authenticated=X/postgres, service_role=X/postgres |
| public | postgres | sequences | postgres=rwU/postgres, anon=rwU/postgres, authenticated=rwU/postgres, service_role=rwU/postgres |
| public | postgres | tables | postgres=arwdDxtm/postgres, anon=rm/postgres, authenticated=arwdm/postgres, service_role=arwdDxtm/postgres |
| public | supabase_admin | functions | postgres=X/supabase_admin, anon=X/supabase_admin, authenticated=X/supabase_admin, service_role=X/supabase_admin |
| public | supabase_admin | sequences | postgres=rwU/supabase_admin, anon=rwU/supabase_admin, authenticated=rwU/supabase_admin, service_role=rwU/supabase_admin |
| public | supabase_admin | tables | postgres=arwdDxtm/supabase_admin, anon=arwdDxtm/supabase_admin, authenticated=arwdDxtm/supabase_admin, service_role=arwdDxtm/supabase_admin |
| realtime | supabase_admin | functions | postgres=X/supabase_admin, dashboard_user=X/supabase_admin |
| realtime | supabase_admin | sequences | postgres=rwU/supabase_admin, dashboard_user=rwU/supabase_admin |
| realtime | supabase_admin | tables | postgres=a*r*wdDxtm/supabase_admin, dashboard_user=arwdDxtm/supabase_admin |
| storage | postgres | functions | postgres=X/postgres, anon=X/postgres, authenticated=X/postgres, service_role=X/postgres |
| storage | postgres | sequences | postgres=rwU/postgres, anon=rwU/postgres, authenticated=rwU/postgres, service_role=rwU/postgres |
| storage | postgres | tables | postgres=arwdDxtm/postgres, anon=arwdDxtm/postgres, authenticated=arwdDxtm/postgres, service_role=arwdDxtm/postgres |

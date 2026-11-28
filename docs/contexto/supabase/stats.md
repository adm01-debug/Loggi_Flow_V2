# Métricas (voláteis — mudam sem alteração de schema)

Valores aproximados de propósito, para não gerar commits a cada coleta. Fora de `snapshot.json`; o bruto está em `stats.json`.

## Banco

| métrica | valor |
|---|---|
| tamanho | 99.9 MB |
| schema public | 69.6 MB |
| schema internal | 2.8 MB |
| schema audit_tmp | 2.0 MB |


## Tabelas (ordenadas por tamanho)

| tabela | linhas (~) | total | heap | índices | linhas mortas (~) | seq scans (~) | idx scans (~) | último autovacuum |
|---|---|---|---|---|---|---|---|---|
| public.audit_logs_y2026m08 | ~3.7k | 14.5 MB | 2.9 MB | 11.5 MB | 0 | ~50 | ~3.7k | 2026-08-31 |
| public.rate_limit_logs | ~26k | 10.2 MB | 3.0 MB | 7.2 MB | ~280 | ~50 | ~102.4k | 2026-11-24 |
| public.rte_gateway_health | ~23k | 7.4 MB | 3.3 MB | 4.1 MB | ~4.6k | ~580 | ~21.7k | 2026-11-22 |
| public.audit_logs_y2026m09 | ~5.6k | 7.4 MB | 3.5 MB | 3.8 MB | 0 | ~60 | ~140 | 2026-09-26 |
| public.audit_logs_y2026m11 | ~4.3k | 7.3 MB | 3.4 MB | 3.9 MB | 9 | ~70 | ~360 | 2026-11-26 |
| public.audit_logs_y2026m10 | ~4.7k | 5.9 MB | 2.9 MB | 2.9 MB | 0 | ~60 | ~320 | 2026-10-25 |
| public.notifications | ~10.6k | 5.8 MB | 3.1 MB | 2.6 MB | ~10 | ~190 | ~480 | 2026-11-19 |
| internal.query_baseline | ~4.7k | 2.8 MB | 2.2 MB | 528.0 KB | ~500 | ~20 | ~12.5k | 2026-11-22 |
| public.audit_logs_y2026m07 | 2 | 1.6 MB | 8.0 KB | 1.5 MB | 0 | ~70 | ~1k | 2026-08-31 |
| public.security_events | ~1.5k | 1.5 MB | 1000.0 KB | 496.0 KB | ~10 | ~30 | ~3.9k | 2026-11-26 |
| audit_tmp.manifest | ~6.8k | 1.3 MB | 1.3 MB | 0 B | ~200 | ~60 |  | 2026-08-31 |
| public.telemetry_logs | ~660 | 736.0 KB | 520.0 KB | 176.0 KB | 8 | ~30 | ~220 | 2026-09-27 |
| public.db_health_snapshots | ~710 | 552.0 KB | 408.0 KB | 104.0 KB | 0 | ~990 | ~2.8k | 2026-11-28 |
| public.contract_test_logs | ~1.5k | 464.0 KB | 336.0 KB | 88.0 KB | ~260 | ~420 | ~130 | 2026-11-20 |
| audit_tmp.load_log | ~2.8k | 376.0 KB | 336.0 KB | 0 B | 0 | ~370 |  | 2026-11-23 |
| public.rte_slo_daily_snapshots | ~910 | 368.0 KB | 144.0 KB | 192.0 KB | ~40 | ~400 | ~2.9k |  |
| public.nexus_tactical_logs | ~210 | 320.0 KB | 192.0 KB | 96.0 KB | 0 | ~200 | 0 |  |
| audit_tmp.seed_backup | 0 | 176.0 KB | 24.0 KB | 16.0 KB | 0 | 1 | ~30 |  |
| public.coletas | 0 | 176.0 KB | 0 B | 152.0 KB | 0 | ~172k | ~1.1k | 2026-11-19 |
| public.entregas | 0 | 168.0 KB | 0 B | 144.0 KB | 0 | ~234.3k | ~1.7k | 2026-11-19 |
| public.cotacoes_multicanal | 0 | 112.0 KB | 8.0 KB | 96.0 KB | 2 | ~450 | 2 |  |
| public.login_attempts | 0 | 112.0 KB | 8.0 KB | 96.0 KB | ~20 | ~160 | 6 |  |
| public.audit_logs_y2026m12 | 0 | 104.0 KB | 0 B | 96.0 KB | 0 | ~70 | ~360 |  |
| public.audit_logs_y2027m01 | 0 | 104.0 KB | 0 B | 96.0 KB | 0 | ~70 | ~360 |  |
| public.audit_logs_y2027m02 | 0 | 104.0 KB | 0 B | 96.0 KB | 0 | ~70 | ~360 |  |
| public.audit_logs_y2027m03 | 0 | 104.0 KB | 0 B | 96.0 KB | 0 | ~70 | ~360 |  |
| public.audit_logs_y2027m04 | 0 | 104.0 KB | 0 B | 96.0 KB | 0 | ~70 | ~360 |  |
| public.audit_logs_y2027m05 | 0 | 104.0 KB | 0 B | 96.0 KB | 0 | ~70 | ~360 |  |
| public.audit_logs_y2027m06 | 0 | 104.0 KB | 0 B | 96.0 KB | 0 | ~70 | ~360 |  |
| public.audit_logs_y2027m07 | 0 | 104.0 KB | 0 B | 96.0 KB | 0 | ~60 | ~360 |  |
| public.db_health_score_history | ~110 | 104.0 KB | 40.0 KB | 32.0 KB | 0 | ~400 | ~6.9k |  |
| public.transportadoras | 5 | 104.0 KB | 16.0 KB | 48.0 KB | 8 | ~28.4k | ~2.6k | 2026-08-31 |
| public.geo_blocking_rules | 0 | 96.0 KB | 8.0 KB | 80.0 KB | 0 | ~40 | 7 |  |
| public.ocorrencias | 0 | 96.0 KB | 8.0 KB | 80.0 KB | ~30 | ~2.3k | 1 |  |
| public.logistica_reversa | 1 | 88.0 KB | 8.0 KB | 72.0 KB | 0 | ~80 | ~140 |  |
| public.user_levels | 7 | 88.0 KB | 8.0 KB | 80.0 KB | ~50 | ~260 | ~50 |  |
| public.user_roles | 9 | 88.0 KB | 8.0 KB | 48.0 KB | 4 | ~8.9k | ~2.1k | 2026-11-18 |
| public.conciliacoes | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 8 | ~40 | 6 |  |
| public.cotacoes_frete | 0 | 80.0 KB | 8.0 KB | 64.0 KB | ~30 | ~50 | ~130 |  |
| public.db_slo_daily | ~100 | 80.0 KB | 16.0 KB | 32.0 KB | 0 | ~450 | ~420 |  |
| public.fornecedores | 0 | 80.0 KB | 8.0 KB | 48.0 KB | ~10 | ~70 | ~1.2k | 2026-08-31 |
| public.known_devices | 3 | 80.0 KB | 8.0 KB | 64.0 KB | ~20 | ~290 | ~120 |  |
| public.password_reset_requests | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 1 | ~40 | 6 |  |
| public.profiles | 7 | 80.0 KB | 8.0 KB | 32.0 KB | 4 | ~570 | ~300 | 2026-11-18 |
| public.tabelas_frete | ~50 | 80.0 KB | 8.0 KB | 64.0 KB | 0 | ~50 | ~110 |  |
| public.bio_sync_telemetry | 0 | 72.0 KB | 0 B | 64.0 KB | 0 | ~40 | ~780 |  |
| public.geo_access_rules | 1 | 72.0 KB | 8.0 KB | 64.0 KB | 0 | ~70 | 1 |  |
| public.clientes | 0 | 64.0 KB | 8.0 KB | 32.0 KB | ~10 | ~130 | ~2.4k | 2026-08-31 |
| public.system_heartbeat | 5 | 64.0 KB | 8.0 KB | 16.0 KB | ~40 | ~128.5k | ~150 | 2026-11-28 |
| public.transportadora_rotas | 0 | 64.0 KB | 0 B | 56.0 KB | 0 | ~90 | ~60 |  |
| public.delay_predictions_history | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~250 | ~310 |  |
| public.role_permissions | ~30 | 56.0 KB | 8.0 KB | 48.0 KB | 0 | ~40 | ~30 |  |
| audit_tmp.sql | 0 | 48.0 KB | 8.0 KB | 16.0 KB | 0 | 1 | ~10 |  |
| public.achievements | 6 | 48.0 KB | 8.0 KB | 32.0 KB | ~30 | ~180 | ~30 |  |
| public.alertas_custo | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~40 | ~70 |  |
| public.business_rules | 7 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~40 | ~10 |  |
| public.business_rules_config | ~20 | 48.0 KB | 8.0 KB | 32.0 KB | 8 | ~70 | ~40 |  |
| public.conciliacao_itens_importados | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~40 | ~10 |  |
| public.error_events | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | 6 |  |
| public.feature_flags | ~20 | 48.0 KB | 8.0 KB | 32.0 KB | 5 | ~8k | ~20 |  |
| public.fretes_internos | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~110 | 0 |  |
| public.ip_access_rules | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~40 | ~50 |  |
| public.mitigation_actions | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~40 | 6 |  |
| public.permissions | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~40 | ~60 |  |
| public.scheduled_reports | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 2 | ~40 | 3 |  |
| public.user_onboarding | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 4 | ~30 | ~140 |  |
| public.user_ranks | 5 | 48.0 KB | 8.0 KB | 32.0 KB | 5 | ~120 | ~90 |  |
| public.comments | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~40 | 6 |  |
| public.freight_decisions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~40 | ~70 |  |
| public.index_proposals | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~100 |  |
| public.rastreamento_alertas | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~40 | ~60 |  |
| public.rastreamento_historico_y2026m01 | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~60 |  |
| public.rastreamento_historico_y2026m02 | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~60 |  |
| public.rastreamento_historico_y2026m03 | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~60 |  |
| public.rastreamento_historico_y2026m04 | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~60 |  |
| public.rastreamento_historico_y2026m05 | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~60 |  |
| public.rastreamento_historico_y2026m06 | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~60 |  |
| public.rastreamento_historico_y2026m07 | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~60 |  |
| public.rastreamento_historico_y2026m08 | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~60 |  |
| public.rastreamento_historico_y2026m09 | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~60 |  |
| public.rastreamento_historico_y2026m10 | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~60 |  |
| public.rastreamento_historico_y2026m11 | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~60 |  |
| public.rastreamento_historico_y2026m12 | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~60 |  |
| public.rastreamento_historico_y2027m01 | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~60 |  |
| public.rastreamento_historico_y2027m02 | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~60 |  |
| public.rastreamento_historico_y2027m03 | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~60 |  |
| public.rastreamento_historico_y2027m04 | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~60 |  |
| public.rastreamento_historico_y2027m05 | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~60 |  |
| public.rastreamento_historico_y2027m06 | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~50 | ~60 |  |
| public.remediation_actions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~140 | 2 |  |
| public.user_notification_preferences | 0 | 40.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | 7 |  |
| public.user_sessions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~120 | 0 |  |
| public.webauthn_credentials | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~40 | 6 |  |
| audit_tmp.cfg | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 1 | 5 | ~2.9k |  |
| audit_tmp.job_test | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | 2 | ~20 |  |
| audit_tmp.req | ~60 | 32.0 KB | 8.0 KB | 16.0 KB | ~40 | ~370 | ~2.9k |  |
| public.ai_delay_predictions | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | ~450 |  |
| public.architecture_decisions | 2 | 32.0 KB | 8.0 KB | 16.0 KB | 1 | ~40 | 3 |  |
| public.bio_sync_alert_rules | 1 | 32.0 KB | 8.0 KB | 16.0 KB | 1 | ~40 | 3 |  |
| public.bitrix_sync_config | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 2 | ~280 | 3 |  |
| public.carrier_rankings | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~100 | 0 |  |
| public.delivery_receipt_audit | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | ~70 |  |
| public.freight_selection_rules | 3 | 32.0 KB | 8.0 KB | 16.0 KB | 3 | ~40 | 3 |  |
| public.kanban_history | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | ~70 |  |
| public.push_subscriptions | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | 6 |  |
| public.query_telemetry | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | 0 |  |
| public.reward_items | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~180 | 0 |  |
| public.reward_purchases | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | 0 |  |
| public.user_achievements | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~40 | ~100 |  |
| public.user_panel_preferences | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | 3 | 0 |  |
| public.webauthn_challenges | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 6 |  |
| public.ai_chat_messages | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 1 |  |
| public.bitrix_sync_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 2 |  |
| public.freight_integration_mappings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | ~60 |  |
| public.freight_webhooks | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | ~60 |  |
| public.geo_blocked_attempts | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~120 | 0 |  |
| public.geo_blocking_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 6 |  |
| public.idempotency_keys | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 1 |  |
| public.notificacoes_custo | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 0 |  |
| public.organizations | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 0 |  |
| public.prediction_accuracy_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~130 | ~10 |  |
| public.rte_slo_targets | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | ~180 |  |
| public.rule_execution_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.webhook_deliveries | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 0 |  |
| public.webhook_events_processed | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 0 |  |
| public.webhook_inbound_failures | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | 5 | 2 |  |
| public.automation_audit_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.client_webhooks | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| public.performance_metrics | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~140 | 0 |  |
| public.risk_zones | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~230 | 0 |  |
| public.sla_alerts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~370 | 0 |  |
| public.system_integrity_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.audit_logs | ~3.7k | 0 B | 0 B | 0 B | 0 | 0 | 0 |  |
| public.rastreamento_historico | 0 | 0 B | 0 B | 0 B | 0 | 0 | 0 |  |


## Índices nunca usados (candidatos a remoção; ignore PK/UNIQUE)

| índice | tabela | tamanho |
|---|---|---|
| audit_logs_y2026m07_new_data_idx | public.audit_logs_y2026m07 | 904.0 KB |
| audit_logs_y2026m07_record_id_created_at_idx | public.audit_logs_y2026m07 | 96.0 KB |
| audit_logs_y2026m07_record_id_table_name_created_at_idx | public.audit_logs_y2026m07 | 128.0 KB |
| audit_logs_y2026m08_changed_fields_idx | public.audit_logs_y2026m08 | 264.0 KB |
| audit_logs_y2026m08_new_data_idx | public.audit_logs_y2026m08 | 6.7 MB |
| audit_logs_y2026m08_old_data_idx | public.audit_logs_y2026m08 | 792.0 KB |
| audit_logs_y2026m08_record_id_created_at_idx | public.audit_logs_y2026m08 | 984.0 KB |
| audit_logs_y2026m08_record_id_table_name_created_at_idx | public.audit_logs_y2026m08 | 1.2 MB |
| audit_logs_y2026m08_user_id_created_at_idx | public.audit_logs_y2026m08 | 152.0 KB |
| audit_logs_y2026m09_new_data_idx | public.audit_logs_y2026m09 | 1.2 MB |
| audit_logs_y2026m09_old_data_idx | public.audit_logs_y2026m09 | 584.0 KB |
| audit_logs_y2026m09_record_id_created_at_idx | public.audit_logs_y2026m09 | 528.0 KB |
| audit_logs_y2026m09_record_id_table_name_created_at_idx | public.audit_logs_y2026m09 | 608.0 KB |
| audit_logs_y2026m10_new_data_idx | public.audit_logs_y2026m10 | 1.1 MB |
| audit_logs_y2026m10_record_id_created_at_idx | public.audit_logs_y2026m10 | 472.0 KB |
| audit_logs_y2026m10_record_id_table_name_created_at_idx | public.audit_logs_y2026m10 | 536.0 KB |
| audit_logs_y2026m11_changed_fields_idx | public.audit_logs_y2026m11 | 72.0 KB |
| audit_logs_y2026m11_new_data_idx | public.audit_logs_y2026m11 | 1.0 MB |
| audit_logs_y2026m11_old_data_idx | public.audit_logs_y2026m11 | 1.0 MB |
| audit_logs_y2026m11_record_id_created_at_idx | public.audit_logs_y2026m11 | 368.0 KB |
| audit_logs_y2026m11_record_id_table_name_created_at_idx | public.audit_logs_y2026m11 | 496.0 KB |
| audit_logs_y2026m11_user_id_created_at_idx | public.audit_logs_y2026m11 | 176.0 KB |
| gin_notifications_metadata | public.notifications | 240.0 KB |
| idx_notifications_unread | public.notifications | 96.0 KB |
| idx_notifications_user_read | public.notifications | 560.0 KB |
| idx_notifications_user_unread_created | public.notifications | 464.0 KB |
| idx_rte_gateway_health_gateway_checked_at | public.rte_gateway_health | 2.3 MB |


## Storage

_nenhum_


## Auth (agregados)

| métrica | valor |
|---|---|
| usuários (~) | 7 |
| confirmados (~) | 7 |
| criados últimos 30d (~) | 4 |

| provider | usuários (~) |
|---|---|
| email | 6 |
| google | 1 |


## Consultas mais custosas (pg_stat_statements, desde o último reset)
| role | chamadas (~) | total ms (~) | média ms | query |
|---|---|---|---|---|
| postgres | ~28k | ~2.5M | 88.72 | `SELECT public.refresh_dashboard_views()` |
| service_role | ~8.3k | ~1.5M | 177.70 | `WITH pgrst_source AS (SELECT "pgrst_call".* FROM "public"."get_query_regressions_fast"() pgrst_call) SELECT $3::bigint AS total_result_set, pg_catalog.count(_postgrest_t) AS page_total, coalesce(json_agg(_postgrest_t), $` |
| postgres | ~22.9k | ~712.6k | 31.06 | `SELECT net.http_post( url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name=$1) \|\| $2, headers := json_build_object( $3,$4, $5,(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name=$6), $7,$8` |
| postgres | ~128.4k | ~594.3k | 4.63 | `SELECT public.record_heartbeat()` |
| postgres | ~170 | ~513.5k | 3020.43 | `with page as ( select c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity, c.relreplident, nc.nspname as schema, -- Computed once here so the final select can reference it for both the -- raw byte count and pg_size` |
| service_role | ~1.8k | ~372.5k | 206.25 | `WITH pgrst_source AS (SELECT pgrst_call.pgrst_scalar FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "sql", "max_rows" FROM json_to_record(pgrst_payload.json_data) AS _("sql" text, "max_rows" integer) LIMIT ` |
| service_role | ~5.2k | ~355.6k | 68.21 | `WITH pgrst_source AS (INSERT INTO "public"."notifications"("action_url", "message", "metadata", "title", "type", "user_id") SELECT "pgrst_body"."action_url", "pgrst_body"."message", "pgrst_body"."metadata", "pgrst_body".` |
| service_role | ~25.4k | ~191.5k | 7.55 | `WITH pgrst_source AS (INSERT INTO "public"."rate_limit_logs"("blocked", "endpoint", "ip_address", "request_count", "window_start") SELECT "pgrst_body"."blocked", "pgrst_body"."endpoint", "pgrst_body"."ip_address", "pgrst` |
| postgres | ~360 | ~183.9k | 516.67 | `SELECT audit_tmp.delta_pull()` |
| service_role | ~8.3k | ~176k | 21.20 | `WITH pgrst_source AS (INSERT INTO "public"."rte_gateway_health"("checked_at", "error_message", "gateway", "http_status", "latency_ms", "online") SELECT "pgrst_body"."checked_at", "pgrst_body"."error_message", "pgrst_body` |
| postgres | ~310 | ~172.1k | 553.29 | `SELECT e.name, n.nspname AS schema, e.default_version, x.extversion AS installed_version, e.comment, ev.schema AS default_version_schema FROM pg_available_extensions e LEFT JOIN pg_extension x ON e.name = x.extname LEFT ` |
| postgres | ~22.9k | ~150.2k | 6.55 | `WITH rows AS ( SELECT id FROM net.http_request_queue ORDER BY id LIMIT $1 ) DELETE FROM net.http_request_queue q USING rows WHERE q.id = rows.id RETURNING q.id, q.method, q.url, timeout_milliseconds, array(select key \|\| ` |
| authenticator | ~400 | ~133.3k | 336.50 | `SELECT name FROM pg_timezone_names` |
| service_role | ~2k | ~104.6k | 51.67 | `WITH pgrst_source AS (SELECT pgrst_call.pgrst_scalar FROM (SELECT "public"."persist_db_health_snapshot"() pgrst_scalar) pgrst_call) SELECT $3::bigint AS total_result_set, $4 AS page_total, coalesce(json_agg(_postgrest_t.` |
| postgres | ~22.9k | ~78.7k | 3.43 | `WITH rows AS ( SELECT ctid FROM net._http_response WHERE created < now() - $1 ORDER BY created LIMIT $2 ) DELETE FROM net._http_response r USING rows WHERE r.ctid = rows.ctid` |


## Conexões
| usuário | estado | n |
|---|---|---|
| authenticator | idle | 11 |
| pgbouncer | idle | 1 |
| postgres | active | 1 |
| postgres | idle | 1 |
| supabase_admin | idle | 2 |
| supabase_admin |  | 1 |

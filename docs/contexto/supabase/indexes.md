# Índices

Uso e tamanho em `stats.md`.

| tabela | índice | método | colunas | único | válido | predicado |
|---|---|---|---|---|---|---|
| audit_tmp.cfg | cfg_pkey | btree | k | sim | sim |  |
| audit_tmp.job_test | job_test_pkey | btree | fn | sim | sim |  |
| audit_tmp.req | req_pkey | btree | name | sim | sim |  |
| audit_tmp.seed_backup | seed_backup_pkey | btree | tbl | sim | sim |  |
| audit_tmp.sql | sql_pkey | btree | name | sim | sim |  |
| internal.query_baseline | idx_query_baseline_captured_at | btree | captured_at | não | sim |  |
| internal.query_baseline | idx_query_baseline_queryid | btree | queryid, captured_at | não | sim |  |
| internal.query_baseline | query_baseline_pkey | btree | id | sim | sim |  |
| public.achievements | achievements_code_key | btree | code | sim | sim |  |
| public.achievements | achievements_pkey | btree | id | sim | sim |  |
| public.ai_chat_messages | ai_chat_messages_pkey | btree | id | sim | sim |  |
| public.ai_chat_messages | idx_chat_user | btree | user_id, created_at | não | sim |  |
| public.ai_delay_predictions | ai_delay_predictions_pkey | btree | id | sim | sim |  |
| public.ai_delay_predictions | idx_ai_delay_predictions_analyzed | btree | analyzed_at | não | sim |  |
| public.ai_delay_predictions | idx_ai_delay_predictions_entity | btree | entity_id | não | sim |  |
| public.alertas_custo | alertas_custo_pkey | btree | id | sim | sim |  |
| public.alertas_custo | idx_alertas_custo_created_by | btree | created_by | não | sim |  |
| public.alertas_custo | idx_alertas_custo_estado | btree | estado_destino | não | sim |  |
| public.alertas_custo | idx_alertas_custo_tipo | btree | tipo | não | sim |  |
| public.alertas_custo | idx_alertas_custo_transportadora_id | btree | transportadora_id | não | sim |  |
| public.architecture_decisions | architecture_decisions_pkey | btree | id | sim | sim |  |
| public.audit_logs | audit_logs_partitioned_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs | gin_audit_logs_changed_fields | gin | changed_fields | não | sim |  |
| public.audit_logs | idx_audit_logs_created_at | btree | created_at | não | sim |  |
| public.audit_logs | idx_audit_logs_new_data_gin | gin | new_data | não | sim |  |
| public.audit_logs | idx_audit_logs_old_data_gin | gin | old_data | não | sim |  |
| public.audit_logs | idx_audit_logs_record_composite | btree | record_id, table_name, created_at | não | sim |  |
| public.audit_logs | idx_audit_logs_record_id_created | btree | record_id, created_at | não | sim |  |
| public.audit_logs | idx_audit_logs_table_action_created | btree | table_name, action, created_at | não | sim |  |
| public.audit_logs | idx_audit_logs_user_created | btree | user_id, created_at | não | sim | `(user_id IS NOT NULL)` |
| public.audit_logs_y2026m07 | audit_logs_y2026m07_changed_fields_idx | gin | changed_fields | não | sim |  |
| public.audit_logs_y2026m07 | audit_logs_y2026m07_created_at_idx | btree | created_at | não | sim |  |
| public.audit_logs_y2026m07 | audit_logs_y2026m07_new_data_idx | gin | new_data | não | sim |  |
| public.audit_logs_y2026m07 | audit_logs_y2026m07_old_data_idx | gin | old_data | não | sim |  |
| public.audit_logs_y2026m07 | audit_logs_y2026m07_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_y2026m07 | audit_logs_y2026m07_record_id_created_at_idx | btree | record_id, created_at | não | sim |  |
| public.audit_logs_y2026m07 | audit_logs_y2026m07_record_id_table_name_created_at_idx | btree | record_id, table_name, created_at | não | sim |  |
| public.audit_logs_y2026m07 | audit_logs_y2026m07_table_name_action_created_at_idx | btree | table_name, action, created_at | não | sim |  |
| public.audit_logs_y2026m07 | audit_logs_y2026m07_user_id_created_at_idx | btree | user_id, created_at | não | sim | `(user_id IS NOT NULL)` |
| public.audit_logs_y2026m08 | audit_logs_y2026m08_changed_fields_idx | gin | changed_fields | não | sim |  |
| public.audit_logs_y2026m08 | audit_logs_y2026m08_created_at_idx | btree | created_at | não | sim |  |
| public.audit_logs_y2026m08 | audit_logs_y2026m08_new_data_idx | gin | new_data | não | sim |  |
| public.audit_logs_y2026m08 | audit_logs_y2026m08_old_data_idx | gin | old_data | não | sim |  |
| public.audit_logs_y2026m08 | audit_logs_y2026m08_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_y2026m08 | audit_logs_y2026m08_record_id_created_at_idx | btree | record_id, created_at | não | sim |  |
| public.audit_logs_y2026m08 | audit_logs_y2026m08_record_id_table_name_created_at_idx | btree | record_id, table_name, created_at | não | sim |  |
| public.audit_logs_y2026m08 | audit_logs_y2026m08_table_name_action_created_at_idx | btree | table_name, action, created_at | não | sim |  |
| public.audit_logs_y2026m08 | audit_logs_y2026m08_user_id_created_at_idx | btree | user_id, created_at | não | sim | `(user_id IS NOT NULL)` |
| public.audit_logs_y2026m09 | audit_logs_y2026m09_changed_fields_idx | gin | changed_fields | não | sim |  |
| public.audit_logs_y2026m09 | audit_logs_y2026m09_created_at_idx | btree | created_at | não | sim |  |
| public.audit_logs_y2026m09 | audit_logs_y2026m09_new_data_idx | gin | new_data | não | sim |  |
| public.audit_logs_y2026m09 | audit_logs_y2026m09_old_data_idx | gin | old_data | não | sim |  |
| public.audit_logs_y2026m09 | audit_logs_y2026m09_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_y2026m09 | audit_logs_y2026m09_record_id_created_at_idx | btree | record_id, created_at | não | sim |  |
| public.audit_logs_y2026m09 | audit_logs_y2026m09_record_id_table_name_created_at_idx | btree | record_id, table_name, created_at | não | sim |  |
| public.audit_logs_y2026m09 | audit_logs_y2026m09_table_name_action_created_at_idx | btree | table_name, action, created_at | não | sim |  |
| public.audit_logs_y2026m09 | audit_logs_y2026m09_user_id_created_at_idx | btree | user_id, created_at | não | sim | `(user_id IS NOT NULL)` |
| public.audit_logs_y2026m10 | audit_logs_y2026m10_changed_fields_idx | gin | changed_fields | não | sim |  |
| public.audit_logs_y2026m10 | audit_logs_y2026m10_created_at_idx | btree | created_at | não | sim |  |
| public.audit_logs_y2026m10 | audit_logs_y2026m10_new_data_idx | gin | new_data | não | sim |  |
| public.audit_logs_y2026m10 | audit_logs_y2026m10_old_data_idx | gin | old_data | não | sim |  |
| public.audit_logs_y2026m10 | audit_logs_y2026m10_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_y2026m10 | audit_logs_y2026m10_record_id_created_at_idx | btree | record_id, created_at | não | sim |  |
| public.audit_logs_y2026m10 | audit_logs_y2026m10_record_id_table_name_created_at_idx | btree | record_id, table_name, created_at | não | sim |  |
| public.audit_logs_y2026m10 | audit_logs_y2026m10_table_name_action_created_at_idx | btree | table_name, action, created_at | não | sim |  |
| public.audit_logs_y2026m10 | audit_logs_y2026m10_user_id_created_at_idx | btree | user_id, created_at | não | sim | `(user_id IS NOT NULL)` |
| public.audit_logs_y2026m11 | audit_logs_y2026m11_changed_fields_idx | gin | changed_fields | não | sim |  |
| public.audit_logs_y2026m11 | audit_logs_y2026m11_created_at_idx | btree | created_at | não | sim |  |
| public.audit_logs_y2026m11 | audit_logs_y2026m11_new_data_idx | gin | new_data | não | sim |  |
| public.audit_logs_y2026m11 | audit_logs_y2026m11_old_data_idx | gin | old_data | não | sim |  |
| public.audit_logs_y2026m11 | audit_logs_y2026m11_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_y2026m11 | audit_logs_y2026m11_record_id_created_at_idx | btree | record_id, created_at | não | sim |  |
| public.audit_logs_y2026m11 | audit_logs_y2026m11_record_id_table_name_created_at_idx | btree | record_id, table_name, created_at | não | sim |  |
| public.audit_logs_y2026m11 | audit_logs_y2026m11_table_name_action_created_at_idx | btree | table_name, action, created_at | não | sim |  |
| public.audit_logs_y2026m11 | audit_logs_y2026m11_user_id_created_at_idx | btree | user_id, created_at | não | sim | `(user_id IS NOT NULL)` |
| public.audit_logs_y2026m12 | audit_logs_y2026m12_changed_fields_idx | gin | changed_fields | não | sim |  |
| public.audit_logs_y2026m12 | audit_logs_y2026m12_created_at_idx | btree | created_at | não | sim |  |
| public.audit_logs_y2026m12 | audit_logs_y2026m12_new_data_idx | gin | new_data | não | sim |  |
| public.audit_logs_y2026m12 | audit_logs_y2026m12_old_data_idx | gin | old_data | não | sim |  |
| public.audit_logs_y2026m12 | audit_logs_y2026m12_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_y2026m12 | audit_logs_y2026m12_record_id_created_at_idx | btree | record_id, created_at | não | sim |  |
| public.audit_logs_y2026m12 | audit_logs_y2026m12_record_id_table_name_created_at_idx | btree | record_id, table_name, created_at | não | sim |  |
| public.audit_logs_y2026m12 | audit_logs_y2026m12_table_name_action_created_at_idx | btree | table_name, action, created_at | não | sim |  |
| public.audit_logs_y2026m12 | audit_logs_y2026m12_user_id_created_at_idx | btree | user_id, created_at | não | sim | `(user_id IS NOT NULL)` |
| public.audit_logs_y2027m01 | audit_logs_y2027m01_changed_fields_idx | gin | changed_fields | não | sim |  |
| public.audit_logs_y2027m01 | audit_logs_y2027m01_created_at_idx | btree | created_at | não | sim |  |
| public.audit_logs_y2027m01 | audit_logs_y2027m01_new_data_idx | gin | new_data | não | sim |  |
| public.audit_logs_y2027m01 | audit_logs_y2027m01_old_data_idx | gin | old_data | não | sim |  |
| public.audit_logs_y2027m01 | audit_logs_y2027m01_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_y2027m01 | audit_logs_y2027m01_record_id_created_at_idx | btree | record_id, created_at | não | sim |  |
| public.audit_logs_y2027m01 | audit_logs_y2027m01_record_id_table_name_created_at_idx | btree | record_id, table_name, created_at | não | sim |  |
| public.audit_logs_y2027m01 | audit_logs_y2027m01_table_name_action_created_at_idx | btree | table_name, action, created_at | não | sim |  |
| public.audit_logs_y2027m01 | audit_logs_y2027m01_user_id_created_at_idx | btree | user_id, created_at | não | sim | `(user_id IS NOT NULL)` |
| public.audit_logs_y2027m02 | audit_logs_y2027m02_changed_fields_idx | gin | changed_fields | não | sim |  |
| public.audit_logs_y2027m02 | audit_logs_y2027m02_created_at_idx | btree | created_at | não | sim |  |
| public.audit_logs_y2027m02 | audit_logs_y2027m02_new_data_idx | gin | new_data | não | sim |  |
| public.audit_logs_y2027m02 | audit_logs_y2027m02_old_data_idx | gin | old_data | não | sim |  |
| public.audit_logs_y2027m02 | audit_logs_y2027m02_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_y2027m02 | audit_logs_y2027m02_record_id_created_at_idx | btree | record_id, created_at | não | sim |  |
| public.audit_logs_y2027m02 | audit_logs_y2027m02_record_id_table_name_created_at_idx | btree | record_id, table_name, created_at | não | sim |  |
| public.audit_logs_y2027m02 | audit_logs_y2027m02_table_name_action_created_at_idx | btree | table_name, action, created_at | não | sim |  |
| public.audit_logs_y2027m02 | audit_logs_y2027m02_user_id_created_at_idx | btree | user_id, created_at | não | sim | `(user_id IS NOT NULL)` |
| public.audit_logs_y2027m03 | audit_logs_y2027m03_changed_fields_idx | gin | changed_fields | não | sim |  |
| public.audit_logs_y2027m03 | audit_logs_y2027m03_created_at_idx | btree | created_at | não | sim |  |
| public.audit_logs_y2027m03 | audit_logs_y2027m03_new_data_idx | gin | new_data | não | sim |  |
| public.audit_logs_y2027m03 | audit_logs_y2027m03_old_data_idx | gin | old_data | não | sim |  |
| public.audit_logs_y2027m03 | audit_logs_y2027m03_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_y2027m03 | audit_logs_y2027m03_record_id_created_at_idx | btree | record_id, created_at | não | sim |  |
| public.audit_logs_y2027m03 | audit_logs_y2027m03_record_id_table_name_created_at_idx | btree | record_id, table_name, created_at | não | sim |  |
| public.audit_logs_y2027m03 | audit_logs_y2027m03_table_name_action_created_at_idx | btree | table_name, action, created_at | não | sim |  |
| public.audit_logs_y2027m03 | audit_logs_y2027m03_user_id_created_at_idx | btree | user_id, created_at | não | sim | `(user_id IS NOT NULL)` |
| public.audit_logs_y2027m04 | audit_logs_y2027m04_changed_fields_idx | gin | changed_fields | não | sim |  |
| public.audit_logs_y2027m04 | audit_logs_y2027m04_created_at_idx | btree | created_at | não | sim |  |
| public.audit_logs_y2027m04 | audit_logs_y2027m04_new_data_idx | gin | new_data | não | sim |  |
| public.audit_logs_y2027m04 | audit_logs_y2027m04_old_data_idx | gin | old_data | não | sim |  |
| public.audit_logs_y2027m04 | audit_logs_y2027m04_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_y2027m04 | audit_logs_y2027m04_record_id_created_at_idx | btree | record_id, created_at | não | sim |  |
| public.audit_logs_y2027m04 | audit_logs_y2027m04_record_id_table_name_created_at_idx | btree | record_id, table_name, created_at | não | sim |  |
| public.audit_logs_y2027m04 | audit_logs_y2027m04_table_name_action_created_at_idx | btree | table_name, action, created_at | não | sim |  |
| public.audit_logs_y2027m04 | audit_logs_y2027m04_user_id_created_at_idx | btree | user_id, created_at | não | sim | `(user_id IS NOT NULL)` |
| public.audit_logs_y2027m05 | audit_logs_y2027m05_changed_fields_idx | gin | changed_fields | não | sim |  |
| public.audit_logs_y2027m05 | audit_logs_y2027m05_created_at_idx | btree | created_at | não | sim |  |
| public.audit_logs_y2027m05 | audit_logs_y2027m05_new_data_idx | gin | new_data | não | sim |  |
| public.audit_logs_y2027m05 | audit_logs_y2027m05_old_data_idx | gin | old_data | não | sim |  |
| public.audit_logs_y2027m05 | audit_logs_y2027m05_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_y2027m05 | audit_logs_y2027m05_record_id_created_at_idx | btree | record_id, created_at | não | sim |  |
| public.audit_logs_y2027m05 | audit_logs_y2027m05_record_id_table_name_created_at_idx | btree | record_id, table_name, created_at | não | sim |  |
| public.audit_logs_y2027m05 | audit_logs_y2027m05_table_name_action_created_at_idx | btree | table_name, action, created_at | não | sim |  |
| public.audit_logs_y2027m05 | audit_logs_y2027m05_user_id_created_at_idx | btree | user_id, created_at | não | sim | `(user_id IS NOT NULL)` |
| public.audit_logs_y2027m06 | audit_logs_y2027m06_changed_fields_idx | gin | changed_fields | não | sim |  |
| public.audit_logs_y2027m06 | audit_logs_y2027m06_created_at_idx | btree | created_at | não | sim |  |
| public.audit_logs_y2027m06 | audit_logs_y2027m06_new_data_idx | gin | new_data | não | sim |  |
| public.audit_logs_y2027m06 | audit_logs_y2027m06_old_data_idx | gin | old_data | não | sim |  |
| public.audit_logs_y2027m06 | audit_logs_y2027m06_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_y2027m06 | audit_logs_y2027m06_record_id_created_at_idx | btree | record_id, created_at | não | sim |  |
| public.audit_logs_y2027m06 | audit_logs_y2027m06_record_id_table_name_created_at_idx | btree | record_id, table_name, created_at | não | sim |  |
| public.audit_logs_y2027m06 | audit_logs_y2027m06_table_name_action_created_at_idx | btree | table_name, action, created_at | não | sim |  |
| public.audit_logs_y2027m06 | audit_logs_y2027m06_user_id_created_at_idx | btree | user_id, created_at | não | sim | `(user_id IS NOT NULL)` |
| public.audit_logs_y2027m07 | audit_logs_y2027m07_changed_fields_idx | gin | changed_fields | não | sim |  |
| public.audit_logs_y2027m07 | audit_logs_y2027m07_created_at_idx | btree | created_at | não | sim |  |
| public.audit_logs_y2027m07 | audit_logs_y2027m07_new_data_idx | gin | new_data | não | sim |  |
| public.audit_logs_y2027m07 | audit_logs_y2027m07_old_data_idx | gin | old_data | não | sim |  |
| public.audit_logs_y2027m07 | audit_logs_y2027m07_pkey | btree | id, created_at | sim | sim |  |
| public.audit_logs_y2027m07 | audit_logs_y2027m07_record_id_created_at_idx | btree | record_id, created_at | não | sim |  |
| public.audit_logs_y2027m07 | audit_logs_y2027m07_record_id_table_name_created_at_idx | btree | record_id, table_name, created_at | não | sim |  |
| public.audit_logs_y2027m07 | audit_logs_y2027m07_table_name_action_created_at_idx | btree | table_name, action, created_at | não | sim |  |
| public.audit_logs_y2027m07 | audit_logs_y2027m07_user_id_created_at_idx | btree | user_id, created_at | não | sim | `(user_id IS NOT NULL)` |
| public.automation_audit_logs | automation_audit_logs_pkey | btree | id | sim | sim |  |
| public.bio_sync_alert_rules | bio_sync_alert_rules_pkey | btree | id | sim | sim |  |
| public.bio_sync_telemetry | bio_sync_telemetry_pkey | btree | id | sim | sim |  |
| public.bio_sync_telemetry | brin_bio_sync_telemetry_created_at | brin | created_at | não | sim |  |
| public.bio_sync_telemetry | idx_bio_time | btree | timestamp | não | sim |  |
| public.bitrix_sync_config | bitrix_sync_config_pkey | btree | id | sim | sim |  |
| public.bitrix_sync_logs | bitrix_sync_logs_pkey | btree | id | sim | sim |  |
| public.bitrix_sync_logs | idx_bitrix_sync_logs_config_id | btree | config_id | não | sim |  |
| public.business_rules | business_rules_pkey | btree | id | sim | sim |  |
| public.business_rules | idx_business_rules_created_by | btree | created_by | não | sim |  |
| public.business_rules_config | business_rules_config_pkey | btree | key | sim | sim |  |
| public.business_rules_config | idx_business_rules_config_updated_by | btree | updated_by | não | sim |  |
| public.carrier_rankings | carrier_rankings_pkey | btree | id | sim | sim |  |
| public.carrier_rankings | carrier_rankings_transportadora_id_period_key | btree | transportadora_id, period | sim | sim |  |
| public.carrier_rankings | idx_carrier_rankings_transportadora_id | btree | transportadora_id | não | sim |  |
| public.client_webhooks | client_webhooks_pkey | btree | id | sim | sim |  |
| public.clientes | clientes_pkey | btree | id | sim | sim |  |
| public.clientes | idx_clientes_deleted_at | btree | deleted_at | não | sim | `(deleted_at IS NULL)` |
| public.coletas | coletas_numero_coleta_key | btree | numero_coleta | sim | sim |  |
| public.coletas | coletas_pkey | btree | id | sim | sim |  |
| public.coletas | idx_coletas_created_at | btree | created_at | não | sim |  |
| public.coletas | idx_coletas_deleted_at | btree | deleted_at | não | sim | `(deleted_at IS NULL)` |
| public.coletas | idx_coletas_flags | btree | is_reverse, is_urgent, status | não | sim |  |
| public.coletas | idx_coletas_fornecedor_id | btree | fornecedor_id | não | sim |  |
| public.coletas | idx_coletas_numero_coleta_trgm | gin | numero_coleta | não | sim |  |
| public.coletas | idx_coletas_prevista_pendente | btree | data_prevista_coleta | não | sim | `(data_efetiva_coleta IS NULL)` |
| public.coletas | idx_coletas_status_created_at | btree | status, created_at | não | sim |  |
| public.coletas | idx_coletas_status_data | btree | status, data_prevista_coleta | não | sim |  |
| public.coletas | idx_coletas_transp_status | btree | transportadora_id, status | não | sim |  |
| public.coletas | idx_coletas_transportadora_id | btree | transportadora_id | não | sim |  |
| public.comments | comments_pkey | btree | id | sim | sim |  |
| public.comments | idx_comments_created | btree | created_at | não | sim |  |
| public.comments | idx_comments_entity | btree | entity_type, entity_id | não | sim |  |
| public.comments | idx_comments_user_id | btree | user_id | não | sim |  |
| public.conciliacao_itens_importados | conciliacao_itens_importados_pkey | btree | id | sim | sim |  |
| public.conciliacao_itens_importados | idx_conciliacao_itens_importados_conciliacao_id | btree | conciliacao_id | não | sim |  |
| public.conciliacao_itens_importados | idx_conciliacao_itens_importados_conciliado_por | btree | conciliado_por | não | sim |  |
| public.conciliacao_itens_importados | idx_conciliacao_itens_referencia | btree | referencia_externa | não | sim |  |
| public.conciliacao_itens_importados | idx_conciliacao_itens_status | btree | status | não | sim |  |
| public.conciliacoes | conciliacoes_pkey | btree | id | sim | sim |  |
| public.conciliacoes | idx_conciliacoes_created_by | btree | created_by | não | sim |  |
| public.conciliacoes | idx_conciliacoes_status | btree | status | não | sim |  |
| public.conciliacoes | idx_conciliacoes_tipo | btree | tipo | não | sim |  |
| public.contract_test_logs | contract_test_logs_pkey | btree | id | sim | sim |  |
| public.cotacoes_frete | cotacoes_frete_pkey | btree | id | sim | sim |  |
| public.cotacoes_frete | idx_cotacoes_frete_created_at | btree | created_at | não | sim |  |
| public.cotacoes_frete | idx_cotacoes_frete_entrega_id | btree | entrega_id | não | sim |  |
| public.cotacoes_frete | idx_cotacoes_frete_transportadora_id | btree | transportadora_id | não | sim |  |
| public.cotacoes_multicanal | cotacoes_multicanal_pkey | btree | id | sim | sim |  |
| public.cotacoes_multicanal | idx_cotacoes_multi_created | btree | created_at | não | sim |  |
| public.cotacoes_multicanal | idx_cotacoes_multi_status | btree | status | não | sim |  |
| public.cotacoes_multicanal | idx_cotacoes_multicanal_transp_valor | btree | transportadora_id, valor_cotado | não | sim |  |
| public.cotacoes_multicanal | idx_cotacoes_multicanal_transportadora_id | btree | transportadora_id | não | sim |  |
| public.cotacoes_multicanal | idx_cotacoes_multicanal_user_status | btree | user_id, status | não | sim |  |
| public.db_health_score_history | db_health_score_history_pkey | btree | id | sim | sim |  |
| public.db_health_score_history | idx_health_score_history_captured | btree | captured_at | não | sim |  |
| public.db_health_snapshots | db_health_snapshots_pkey | btree | id | sim | sim |  |
| public.db_health_snapshots | idx_db_health_snapshots_created_at_brin | brin | created_at | não | sim |  |
| public.db_slo_daily | db_slo_daily_day_key | btree | day | sim | sim |  |
| public.db_slo_daily | db_slo_daily_pkey | btree | id | sim | sim |  |
| public.delay_predictions_history | delay_predictions_history_pkey | btree | id | sim | sim |  |
| public.delay_predictions_history | idx_delay_pred_hist_transp | btree | transportadora, predicted_at | não | sim |  |
| public.delay_predictions_history | idx_dph_entity | btree | entity_id, predicted_at | não | sim |  |
| public.delay_predictions_history | idx_dph_predicted_at | btree | predicted_at | não | sim |  |
| public.delay_predictions_history | idx_dph_risco | btree | risco | não | sim |  |
| public.delay_predictions_history | idx_dph_unconfirmed | btree | entity_id | não | sim | `(confirmed_at IS NULL)` |
| public.delivery_receipt_audit | delivery_receipt_audit_pkey | btree | id | sim | sim |  |
| public.delivery_receipt_audit | idx_delivery_receipt_audit_delivery_id | btree | delivery_id | não | sim |  |
| public.delivery_receipt_audit | idx_delivery_receipt_audit_user_id | btree | user_id | não | sim |  |
| public.entregas | entregas_numero_entrega_key | btree | numero_entrega | sim | sim |  |
| public.entregas | entregas_pkey | btree | id | sim | sim |  |
| public.entregas | idx_entregas_active | btree | created_at | não | sim | `(deleted_at IS NULL)` |
| public.entregas | idx_entregas_cliente_id | btree | cliente_id | não | sim |  |
| public.entregas | idx_entregas_codigo_rastreamento | btree | codigo_rastreamento | não | sim | `(codigo_rastreamento IS NOT NULL)` |
| public.entregas | idx_entregas_coordinates | btree | latitude, longitude | não | sim | `((latitude IS NOT NULL) AND (longitude IS NOT NULL))` |
| public.entregas | idx_entregas_created_at | btree | created_at | não | sim |  |
| public.entregas | idx_entregas_deleted_at | btree | deleted_at | não | sim | `(deleted_at IS NULL)` |
| public.entregas | idx_entregas_nf_remessa | btree | nf_remessa | não | sim | `(nf_remessa IS NOT NULL)` |
| public.entregas | idx_entregas_previsao | btree | previsao_entrega | não | sim | `(data_entrega_efetiva IS NULL)` |
| public.entregas | idx_entregas_previsao_active | btree | previsao_entrega | não | sim | `((status <> ALL (ARRAY['entregue'::entrega_status, 'finalizado'::entrega_status])) AND (deleted_at IS NULL))` |
| public.entregas | idx_entregas_previsao_pendente | btree | previsao_entrega | não | sim | `((data_entrega_efetiva IS NULL) AND (deleted_at IS NULL))` |
| public.entregas | idx_entregas_rastreamento | btree | codigo_rastreamento | não | sim | `((codigo_rastreamento IS NOT NULL) AND (deleted_at IS NULL))` |
| public.entregas | idx_entregas_status | btree | status | não | sim |  |
| public.entregas | idx_entregas_status_created_at | btree | status, created_at | não | sim |  |
| public.entregas | idx_entregas_transp_status | btree | transportadora_id, status | não | sim |  |
| public.entregas | idx_entregas_transportadora_id | btree | transportadora_id | não | sim |  |
| public.error_events | error_events_pkey | btree | id | sim | sim |  |
| public.error_events | idx_error_events_user_id | btree | user_id | não | sim |  |
| public.feature_flags | feature_flags_key_key | btree | key | sim | sim |  |
| public.feature_flags | feature_flags_pkey | btree | id | sim | sim |  |
| public.fornecedores | fornecedores_pkey | btree | id | sim | sim |  |
| public.fornecedores | idx_fornecedores_cnpj | btree | cnpj | não | sim |  |
| public.fornecedores | idx_fornecedores_deleted_at | btree | deleted_at | não | sim | `(deleted_at IS NULL)` |
| public.freight_decisions | freight_decisions_pkey | btree | id | sim | sim |  |
| public.freight_decisions | idx_freight_decisions_created_at | btree | created_at | não | sim |  |
| public.freight_decisions | idx_freight_decisions_selected_carrier_id | btree | selected_carrier_id | não | sim |  |
| public.freight_decisions | idx_freight_decisions_user_id | btree | user_id | não | sim |  |
| public.freight_integration_mappings | freight_integration_mappings_pkey | btree | id | sim | sim |  |
| public.freight_integration_mappings | idx_freight_integration_mappings_transportadora_id | btree | transportadora_id | não | sim |  |
| public.freight_selection_rules | freight_selection_rules_pkey | btree | id | sim | sim |  |
| public.freight_webhooks | freight_webhooks_pkey | btree | id | sim | sim |  |
| public.freight_webhooks | idx_freight_webhooks_transportadora_id | btree | transportadora_id | não | sim |  |
| public.fretes_internos | fretes_internos_pkey | btree | id | sim | sim |  |
| public.fretes_internos | idx_fretes_internos_created_at | btree | created_at | não | sim |  |
| public.fretes_internos | idx_fretes_internos_organization_id | btree | organization_id | não | sim |  |
| public.fretes_internos | idx_fretes_internos_status | btree | status | não | sim |  |
| public.fretes_internos | idx_fretes_internos_status_created | btree | status, created_at | não | sim |  |
| public.geo_access_rules | geo_access_rules_country_code_key | btree | country_code | sim | sim |  |
| public.geo_access_rules | geo_access_rules_pkey | btree | id | sim | sim |  |
| public.geo_access_rules | idx_geo_access_rules_active | btree | is_active | não | sim | `(is_active = true)` |
| public.geo_access_rules | idx_geo_access_rules_created_by | btree | created_by | não | sim |  |
| public.geo_blocked_attempts | geo_blocked_attempts_pkey | btree | id | sim | sim |  |
| public.geo_blocked_attempts | idx_geo_blocked_attempts_created | btree | created_at | não | sim |  |
| public.geo_blocking_rules | geo_blocking_rules_pkey | btree | id | sim | sim |  |
| public.geo_blocking_rules | idx_geo_blocking_country_code | btree | country_code | não | sim |  |
| public.geo_blocking_rules | idx_geo_blocking_is_active | btree | is_active | não | sim |  |
| public.geo_blocking_rules | idx_geo_blocking_rules_created_by | btree | created_by | não | sim |  |
| public.geo_blocking_rules | unique_country_rule | btree | country_code | sim | sim |  |
| public.geo_blocking_settings | geo_blocking_settings_pkey | btree | id | sim | sim |  |
| public.geo_blocking_settings | idx_geo_blocking_settings_updated_by | btree | updated_by | não | sim |  |
| public.idempotency_keys | idempotency_keys_idempotency_key_key | btree | idempotency_key | sim | sim |  |
| public.idempotency_keys | idempotency_keys_pkey | btree | id | sim | sim |  |
| public.index_proposals | idx_index_proposals_applied_by | btree | applied_by | não | sim |  |
| public.index_proposals | idx_index_proposals_proposed_by | btree | proposed_by | não | sim |  |
| public.index_proposals | idx_index_proposals_status | btree | status, created_at | não | sim |  |
| public.index_proposals | index_proposals_pkey | btree | id | sim | sim |  |
| public.ip_access_rules | idx_ip_access_rules_type | btree | rule_type | não | sim |  |
| public.ip_access_rules | ip_access_rules_pkey | btree | id | sim | sim |  |
| public.kanban_history | idx_kanban_history_action_by | btree | action_by | não | sim |  |
| public.kanban_history | idx_kanban_history_delivery_id | btree | delivery_id | não | sim |  |
| public.kanban_history | kanban_history_pkey | btree | id | sim | sim |  |
| public.known_devices | idx_known_devices_fingerprint | btree | device_fingerprint | não | sim |  |
| public.known_devices | idx_known_devices_user_id | btree | user_id | não | sim |  |
| public.known_devices | known_devices_pkey | btree | id | sim | sim |  |
| public.known_devices | known_devices_user_id_device_fingerprint_key | btree | user_id, device_fingerprint | sim | sim |  |
| public.login_attempts | idx_login_attempts_created | btree | created_at | não | sim |  |
| public.login_attempts | idx_login_attempts_email | btree | email | não | sim |  |
| public.login_attempts | idx_login_attempts_email_created | btree | email, created_at | não | sim |  |
| public.login_attempts | idx_login_attempts_ip | btree | ip_address | não | sim |  |
| public.login_attempts | idx_login_attempts_ip_time | btree | ip_address, created_at | não | sim |  |
| public.login_attempts | login_attempts_pkey | btree | id | sim | sim |  |
| public.logistica_reversa | idx_logistica_reversa_cliente_id | btree | cliente_id | não | sim |  |
| public.logistica_reversa | idx_logistica_reversa_created_by | btree | created_by | não | sim |  |
| public.logistica_reversa | idx_logistica_reversa_entrega_id | btree | entrega_id | não | sim |  |
| public.logistica_reversa | logistica_reversa_pkey | btree | id | sim | sim |  |
| public.logistica_reversa | ux_logistica_reversa_codigo_rastreio | btree | codigo_rastreio_reverso | sim | sim | `(codigo_rastreio_reverso IS NOT NULL)` |
| public.mitigation_actions | idx_mitigation_actions_category | btree | category | não | sim |  |
| public.mitigation_actions | idx_mitigation_actions_executed_at | btree | executed_at | não | sim |  |
| public.mitigation_actions | idx_mitigation_actions_status | btree | status | não | sim |  |
| public.mitigation_actions | idx_mitigation_actions_user | btree | user_id | não | sim |  |
| public.mitigation_actions | mitigation_actions_pkey | btree | id | sim | sim |  |
| public.nexus_tactical_logs | brin_nexus_tactical_logs_created_at | brin | created_at | não | sim |  |
| public.nexus_tactical_logs | idx_logs_time | btree | event_time | não | sim |  |
| public.nexus_tactical_logs | idx_logs_vehicle | btree | vehicle_id | não | sim |  |
| public.nexus_tactical_logs | nexus_tactical_logs_pkey | btree | id | sim | sim |  |
| public.notificacoes_custo | idx_notificacoes_custo_alerta_id | btree | alerta_id | não | sim |  |
| public.notificacoes_custo | notificacoes_custo_pkey | btree | id | sim | sim |  |
| public.notifications | gin_notifications_metadata | gin | metadata | não | sim |  |
| public.notifications | idx_notifications_created_at | btree | created_at | não | sim |  |
| public.notifications | idx_notifications_read | btree | read | não | sim |  |
| public.notifications | idx_notifications_unread | btree | user_id | não | sim | `(read = false)` |
| public.notifications | idx_notifications_user_created | btree | user_id, created_at | não | sim |  |
| public.notifications | idx_notifications_user_id | btree | user_id | não | sim |  |
| public.notifications | idx_notifications_user_read | btree | user_id, read, created_at | não | sim |  |
| public.notifications | idx_notifications_user_unread_created | btree | user_id, created_at | não | sim | `(read = false)` |
| public.notifications | notifications_pkey | btree | id | sim | sim |  |
| public.ocorrencias | idx_ocorrencias_coleta_id | btree | coleta_id | não | sim |  |
| public.ocorrencias | idx_ocorrencias_created_at | btree | created_at | não | sim |  |
| public.ocorrencias | idx_ocorrencias_entrega_id | btree | entrega_id, created_at | não | sim |  |
| public.ocorrencias | idx_ocorrencias_resolvida | btree | resolvida | não | sim |  |
| public.ocorrencias | ocorrencias_pkey | btree | id | sim | sim |  |
| public.organizations | organizations_pkey | btree | id | sim | sim |  |
| public.organizations | organizations_slug_key | btree | slug | sim | sim |  |
| public.password_reset_requests | idx_password_reset_requests_email | btree | email | não | sim |  |
| public.password_reset_requests | idx_password_reset_requests_status | btree | status | não | sim |  |
| public.password_reset_requests | idx_password_reset_requests_user_id | btree | user_id | não | sim |  |
| public.password_reset_requests | password_reset_requests_pkey | btree | id | sim | sim |  |
| public.performance_metrics | performance_metrics_pkey | btree | id | sim | sim |  |
| public.permissions | permissions_code_key | btree | code | sim | sim |  |
| public.permissions | permissions_pkey | btree | id | sim | sim |  |
| public.prediction_accuracy_settings | prediction_accuracy_settings_pkey | btree | id | sim | sim |  |
| public.prediction_accuracy_settings | prediction_accuracy_settings_user_id_transportadora_key | btree | user_id, transportadora | sim | sim |  |
| public.profiles | idx_profiles_organization_id | btree | organization_id | não | sim |  |
| public.profiles | profiles_pkey | btree | id | sim | sim |  |
| public.push_subscriptions | idx_push_subscriptions_user_id | btree | user_id | não | sim |  |
| public.push_subscriptions | push_subscriptions_pkey | btree | id | sim | sim |  |
| public.push_subscriptions | push_subscriptions_user_id_endpoint_key | btree | user_id, endpoint | sim | sim |  |
| public.query_telemetry | idx_query_telemetry_created_at | btree | created_at | não | sim |  |
| public.query_telemetry | idx_query_telemetry_severity | btree | severity | não | sim |  |
| public.query_telemetry | query_telemetry_pkey | btree | id | sim | sim |  |
| public.rastreamento_alertas | idx_rastreamento_alertas_coleta_id | btree | coleta_id | não | sim |  |
| public.rastreamento_alertas | idx_rastreamento_alertas_created_at | btree | created_at | não | sim |  |
| public.rastreamento_alertas | idx_rastreamento_alertas_order | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_alertas | rastreamento_alertas_pkey | btree | id | sim | sim |  |
| public.rastreamento_historico | idx_rastreamento_historico_coleta_id | btree | coleta_id | não | sim |  |
| public.rastreamento_historico | idx_rastreamento_historico_created | btree | created_at | não | sim |  |
| public.rastreamento_historico | idx_rastreamento_lalamove_order | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico | rastreamento_historico_pkey | btree | id, recorded_at | sim | sim |  |
| public.rastreamento_historico_y2026m01 | rastreamento_historico_y2026m01_coleta_id_idx1 | btree | coleta_id | não | sim |  |
| public.rastreamento_historico_y2026m01 | rastreamento_historico_y2026m01_created_at_idx | btree | created_at | não | sim |  |
| public.rastreamento_historico_y2026m01 | rastreamento_historico_y2026m01_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico_y2026m01 | rastreamento_historico_y2026m01_pkey | btree | id, recorded_at | sim | sim |  |
| public.rastreamento_historico_y2026m02 | rastreamento_historico_y2026m02_coleta_id_idx1 | btree | coleta_id | não | sim |  |
| public.rastreamento_historico_y2026m02 | rastreamento_historico_y2026m02_created_at_idx | btree | created_at | não | sim |  |
| public.rastreamento_historico_y2026m02 | rastreamento_historico_y2026m02_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico_y2026m02 | rastreamento_historico_y2026m02_pkey | btree | id, recorded_at | sim | sim |  |
| public.rastreamento_historico_y2026m03 | rastreamento_historico_y2026m03_coleta_id_idx1 | btree | coleta_id | não | sim |  |
| public.rastreamento_historico_y2026m03 | rastreamento_historico_y2026m03_created_at_idx | btree | created_at | não | sim |  |
| public.rastreamento_historico_y2026m03 | rastreamento_historico_y2026m03_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico_y2026m03 | rastreamento_historico_y2026m03_pkey | btree | id, recorded_at | sim | sim |  |
| public.rastreamento_historico_y2026m04 | rastreamento_historico_y2026m04_coleta_id_idx1 | btree | coleta_id | não | sim |  |
| public.rastreamento_historico_y2026m04 | rastreamento_historico_y2026m04_created_at_idx | btree | created_at | não | sim |  |
| public.rastreamento_historico_y2026m04 | rastreamento_historico_y2026m04_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico_y2026m04 | rastreamento_historico_y2026m04_pkey | btree | id, recorded_at | sim | sim |  |
| public.rastreamento_historico_y2026m05 | rastreamento_historico_y2026m05_coleta_id_idx1 | btree | coleta_id | não | sim |  |
| public.rastreamento_historico_y2026m05 | rastreamento_historico_y2026m05_created_at_idx | btree | created_at | não | sim |  |
| public.rastreamento_historico_y2026m05 | rastreamento_historico_y2026m05_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico_y2026m05 | rastreamento_historico_y2026m05_pkey | btree | id, recorded_at | sim | sim |  |
| public.rastreamento_historico_y2026m06 | rastreamento_historico_y2026m06_coleta_id_idx1 | btree | coleta_id | não | sim |  |
| public.rastreamento_historico_y2026m06 | rastreamento_historico_y2026m06_created_at_idx | btree | created_at | não | sim |  |
| public.rastreamento_historico_y2026m06 | rastreamento_historico_y2026m06_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico_y2026m06 | rastreamento_historico_y2026m06_pkey | btree | id, recorded_at | sim | sim |  |
| public.rastreamento_historico_y2026m07 | rastreamento_historico_y2026m07_coleta_id_idx1 | btree | coleta_id | não | sim |  |
| public.rastreamento_historico_y2026m07 | rastreamento_historico_y2026m07_created_at_idx | btree | created_at | não | sim |  |
| public.rastreamento_historico_y2026m07 | rastreamento_historico_y2026m07_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico_y2026m07 | rastreamento_historico_y2026m07_pkey | btree | id, recorded_at | sim | sim |  |
| public.rastreamento_historico_y2026m08 | rastreamento_historico_y2026m08_coleta_id_idx1 | btree | coleta_id | não | sim |  |
| public.rastreamento_historico_y2026m08 | rastreamento_historico_y2026m08_created_at_idx | btree | created_at | não | sim |  |
| public.rastreamento_historico_y2026m08 | rastreamento_historico_y2026m08_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico_y2026m08 | rastreamento_historico_y2026m08_pkey | btree | id, recorded_at | sim | sim |  |
| public.rastreamento_historico_y2026m09 | rastreamento_historico_y2026m09_coleta_id_idx1 | btree | coleta_id | não | sim |  |
| public.rastreamento_historico_y2026m09 | rastreamento_historico_y2026m09_created_at_idx | btree | created_at | não | sim |  |
| public.rastreamento_historico_y2026m09 | rastreamento_historico_y2026m09_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico_y2026m09 | rastreamento_historico_y2026m09_pkey | btree | id, recorded_at | sim | sim |  |
| public.rastreamento_historico_y2026m10 | rastreamento_historico_y2026m10_coleta_id_idx1 | btree | coleta_id | não | sim |  |
| public.rastreamento_historico_y2026m10 | rastreamento_historico_y2026m10_created_at_idx | btree | created_at | não | sim |  |
| public.rastreamento_historico_y2026m10 | rastreamento_historico_y2026m10_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico_y2026m10 | rastreamento_historico_y2026m10_pkey | btree | id, recorded_at | sim | sim |  |
| public.rastreamento_historico_y2026m11 | rastreamento_historico_y2026m11_coleta_id_idx1 | btree | coleta_id | não | sim |  |
| public.rastreamento_historico_y2026m11 | rastreamento_historico_y2026m11_created_at_idx | btree | created_at | não | sim |  |
| public.rastreamento_historico_y2026m11 | rastreamento_historico_y2026m11_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico_y2026m11 | rastreamento_historico_y2026m11_pkey | btree | id, recorded_at | sim | sim |  |
| public.rastreamento_historico_y2026m12 | rastreamento_historico_y2026m12_coleta_id_idx1 | btree | coleta_id | não | sim |  |
| public.rastreamento_historico_y2026m12 | rastreamento_historico_y2026m12_created_at_idx | btree | created_at | não | sim |  |
| public.rastreamento_historico_y2026m12 | rastreamento_historico_y2026m12_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico_y2026m12 | rastreamento_historico_y2026m12_pkey | btree | id, recorded_at | sim | sim |  |
| public.rastreamento_historico_y2027m01 | rastreamento_historico_y2027m01_coleta_id_idx1 | btree | coleta_id | não | sim |  |
| public.rastreamento_historico_y2027m01 | rastreamento_historico_y2027m01_created_at_idx | btree | created_at | não | sim |  |
| public.rastreamento_historico_y2027m01 | rastreamento_historico_y2027m01_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico_y2027m01 | rastreamento_historico_y2027m01_pkey | btree | id, recorded_at | sim | sim |  |
| public.rastreamento_historico_y2027m02 | rastreamento_historico_y2027m02_coleta_id_idx1 | btree | coleta_id | não | sim |  |
| public.rastreamento_historico_y2027m02 | rastreamento_historico_y2027m02_created_at_idx | btree | created_at | não | sim |  |
| public.rastreamento_historico_y2027m02 | rastreamento_historico_y2027m02_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico_y2027m02 | rastreamento_historico_y2027m02_pkey | btree | id, recorded_at | sim | sim |  |
| public.rastreamento_historico_y2027m03 | rastreamento_historico_y2027m03_coleta_id_idx1 | btree | coleta_id | não | sim |  |
| public.rastreamento_historico_y2027m03 | rastreamento_historico_y2027m03_created_at_idx | btree | created_at | não | sim |  |
| public.rastreamento_historico_y2027m03 | rastreamento_historico_y2027m03_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico_y2027m03 | rastreamento_historico_y2027m03_pkey | btree | id, recorded_at | sim | sim |  |
| public.rastreamento_historico_y2027m04 | rastreamento_historico_y2027m04_coleta_id_idx1 | btree | coleta_id | não | sim |  |
| public.rastreamento_historico_y2027m04 | rastreamento_historico_y2027m04_created_at_idx | btree | created_at | não | sim |  |
| public.rastreamento_historico_y2027m04 | rastreamento_historico_y2027m04_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico_y2027m04 | rastreamento_historico_y2027m04_pkey | btree | id, recorded_at | sim | sim |  |
| public.rastreamento_historico_y2027m05 | rastreamento_historico_y2027m05_coleta_id_idx1 | btree | coleta_id | não | sim |  |
| public.rastreamento_historico_y2027m05 | rastreamento_historico_y2027m05_created_at_idx | btree | created_at | não | sim |  |
| public.rastreamento_historico_y2027m05 | rastreamento_historico_y2027m05_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico_y2027m05 | rastreamento_historico_y2027m05_pkey | btree | id, recorded_at | sim | sim |  |
| public.rastreamento_historico_y2027m06 | rastreamento_historico_y2027m06_coleta_id_idx1 | btree | coleta_id | não | sim |  |
| public.rastreamento_historico_y2027m06 | rastreamento_historico_y2027m06_created_at_idx | btree | created_at | não | sim |  |
| public.rastreamento_historico_y2027m06 | rastreamento_historico_y2027m06_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  |
| public.rastreamento_historico_y2027m06 | rastreamento_historico_y2027m06_pkey | btree | id, recorded_at | sim | sim |  |
| public.rate_limit_logs | idx_rate_limit_ip_endpoint | btree | ip_address, endpoint, window_start | não | sim |  |
| public.rate_limit_logs | idx_rate_limit_logs_blocked | btree | blocked | não | sim |  |
| public.rate_limit_logs | idx_rate_limit_logs_created_at | btree | created_at | não | sim |  |
| public.rate_limit_logs | idx_rate_limit_logs_endpoint_created | btree | endpoint, created_at | não | sim |  |
| public.rate_limit_logs | idx_rate_limit_logs_ip | btree | ip_address | não | sim |  |
| public.rate_limit_logs | idx_rate_limit_logs_user_id | btree | user_id | não | sim |  |
| public.rate_limit_logs | rate_limit_logs_pkey | btree | id | sim | sim |  |
| public.remediation_actions | idx_remediation_actions_applied_by | btree | applied_by | não | sim |  |
| public.remediation_actions | idx_remediation_status | btree | status, created_at | não | sim |  |
| public.remediation_actions | idx_remediation_suggestion | btree | suggestion_id | não | sim |  |
| public.remediation_actions | remediation_actions_pkey | btree | id | sim | sim |  |
| public.reward_items | reward_items_pkey | btree | id | sim | sim |  |
| public.reward_purchases | idx_reward_purchases_reward_item_id | btree | reward_item_id | não | sim |  |
| public.reward_purchases | idx_reward_purchases_user_created | btree | user_id, created_at | não | sim |  |
| public.reward_purchases | reward_purchases_pkey | btree | id | sim | sim |  |
| public.risk_zones | risk_zones_pkey | btree | id | sim | sim |  |
| public.role_permissions | idx_role_permissions_permission_id | btree | permission_id | não | sim |  |
| public.role_permissions | role_permissions_pkey | btree | id | sim | sim |  |
| public.role_permissions | role_permissions_role_permission_id_key | btree | role, permission_id | sim | sim |  |
| public.rte_gateway_health | idx_rte_gateway_health_checked_at | btree | checked_at | não | sim |  |
| public.rte_gateway_health | idx_rte_gateway_health_gateway_checked_at | btree | gateway, checked_at | não | sim |  |
| public.rte_gateway_health | rte_gateway_health_pkey | btree | id | sim | sim |  |
| public.rte_slo_daily_snapshots | idx_rte_slo_daily_snapshots_day | btree | day | não | sim |  |
| public.rte_slo_daily_snapshots | idx_rte_slo_daily_snapshots_gateway_day | btree | gateway, day | não | sim |  |
| public.rte_slo_daily_snapshots | rte_slo_daily_snapshots_day_gateway_key | btree | day, gateway | sim | sim |  |
| public.rte_slo_daily_snapshots | rte_slo_daily_snapshots_pkey | btree | id | sim | sim |  |
| public.rte_slo_targets | rte_slo_targets_gateway_key | btree | gateway | sim | sim |  |
| public.rte_slo_targets | rte_slo_targets_pkey | btree | id | sim | sim |  |
| public.rule_execution_logs | idx_rule_execution_logs_rule_id | btree | rule_id | não | sim |  |
| public.rule_execution_logs | rule_execution_logs_pkey | btree | id | sim | sim |  |
| public.scheduled_reports | idx_scheduled_reports_user_id | btree | user_id | não | sim |  |
| public.scheduled_reports | scheduled_reports_pkey | btree | id | sim | sim |  |
| public.security_events | idx_security_events_created | btree | created_at | não | sim |  |
| public.security_events | idx_security_events_severity | btree | severity | não | sim |  |
| public.security_events | idx_security_events_type | btree | event_type | não | sim |  |
| public.security_events | idx_security_events_user_id | btree | user_id | não | sim |  |
| public.security_events | idx_security_events_user_time | btree | user_id, created_at | não | sim |  |
| public.security_events | security_events_pkey | btree | id | sim | sim |  |
| public.sla_alerts | sla_alerts_pkey | btree | id | sim | sim |  |
| public.system_heartbeat | system_heartbeat_pkey | btree | service_name | sim | sim |  |
| public.system_integrity_logs | system_integrity_logs_pkey | btree | id | sim | sim |  |
| public.tabelas_frete | idx_tabelas_frete_estado | btree | estado_destino | não | sim |  |
| public.tabelas_frete | idx_tabelas_frete_peso | btree | peso_min_kg, peso_max_kg | não | sim |  |
| public.tabelas_frete | idx_tabelas_frete_transportadora_id | btree | transportadora_id | não | sim |  |
| public.tabelas_frete | tabelas_frete_pkey | btree | id | sim | sim |  |
| public.telemetry_logs | idx_telemetry_logs_category | btree | category | não | sim |  |
| public.telemetry_logs | idx_telemetry_logs_created_at | btree | created_at | não | sim |  |
| public.telemetry_logs | idx_telemetry_logs_severity | btree | severity | não | sim |  |
| public.telemetry_logs | idx_telemetry_logs_user_id | btree | user_id | não | sim |  |
| public.telemetry_logs | telemetry_logs_pkey | btree | id | sim | sim |  |
| public.transportadora_rotas | idx_rotas_cep_destino | btree | destino_cep_inicio, destino_cep_fim | não | sim |  |
| public.transportadora_rotas | idx_rotas_cep_origem | btree | origem_cep_inicio, origem_cep_fim | não | sim |  |
| public.transportadora_rotas | idx_rotas_destino | btree | destino_estado, destino_cidade | não | sim |  |
| public.transportadora_rotas | idx_rotas_origem | btree | origem_estado, origem_cidade | não | sim |  |
| public.transportadora_rotas | idx_transportadora_rotas_cep_range | btree | origem_cep_inicio, origem_cep_fim, destino_cep_inicio, destino_cep_fim | não | sim |  |
| public.transportadora_rotas | idx_transportadora_rotas_transportadora_id | btree | transportadora_id | não | sim |  |
| public.transportadora_rotas | transportadora_rotas_pkey | btree | id | sim | sim |  |
| public.transportadoras | idx_transportadoras_deleted_at | btree | deleted_at | não | sim | `(deleted_at IS NULL)` |
| public.transportadoras | transportadoras_cnpj_key | btree | cnpj | sim | sim |  |
| public.transportadoras | transportadoras_pkey | btree | id | sim | sim |  |
| public.user_achievements | idx_user_achievements_achievement_id | btree | achievement_id | não | sim |  |
| public.user_achievements | idx_user_achievements_user_id | btree | user_id | não | sim |  |
| public.user_achievements | user_achievements_pkey | btree | id | sim | sim |  |
| public.user_achievements | user_achievements_user_id_achievement_id_key | btree | user_id, achievement_id | sim | sim |  |
| public.user_levels | idx_user_levels_rank_id | btree | rank_id | não | sim |  |
| public.user_levels | idx_user_levels_total_xp | btree | total_xp | não | sim |  |
| public.user_levels | idx_user_levels_total_xp_desc | btree | total_xp | não | sim | `(total_xp > 0)` |
| public.user_levels | user_levels_pkey | btree | id | sim | sim |  |
| public.user_levels | user_levels_user_id_key | btree | user_id | sim | sim |  |
| public.user_notification_preferences | user_notification_preferences_pkey | btree | id | sim | sim |  |
| public.user_notification_preferences | user_notification_preferences_user_id_key | btree | user_id | sim | sim |  |
| public.user_onboarding | user_onboarding_pkey | btree | id | sim | sim |  |
| public.user_onboarding | user_onboarding_user_id_key | btree | user_id | sim | sim |  |
| public.user_panel_preferences | idx_user_panel_preferences_user_id | btree | user_id | não | sim |  |
| public.user_panel_preferences | user_panel_preferences_pkey | btree | id | sim | sim |  |
| public.user_panel_preferences | user_panel_preferences_user_id_key | btree | user_id | sim | sim |  |
| public.user_ranks | user_ranks_min_level_key | btree | min_level | sim | sim |  |
| public.user_ranks | user_ranks_pkey | btree | id | sim | sim |  |
| public.user_roles | idx_user_roles_user_id | btree | user_id | não | sim |  |
| public.user_roles | user_roles_pkey | btree | id | sim | sim |  |
| public.user_roles | user_roles_user_id_role_key | btree | user_id, role | sim | sim |  |
| public.user_sessions | idx_user_sessions_last_active | btree | last_active_at | não | sim |  |
| public.user_sessions | idx_user_sessions_user_id | btree | user_id | não | sim |  |
| public.user_sessions | idx_user_sessions_user_last_active | btree | user_id, last_active_at | não | sim |  |
| public.user_sessions | user_sessions_pkey | btree | id | sim | sim |  |
| public.webauthn_challenges | idx_webauthn_challenges_expires | btree | expires_at | não | sim |  |
| public.webauthn_challenges | idx_webauthn_challenges_user_id | btree | user_id | não | sim |  |
| public.webauthn_challenges | webauthn_challenges_pkey | btree | id | sim | sim |  |
| public.webauthn_credentials | idx_webauthn_credentials_user_id | btree | user_id | não | sim |  |
| public.webauthn_credentials | unique_user_credential | btree | user_id, credential_id | sim | sim |  |
| public.webauthn_credentials | webauthn_credentials_credential_id_key | btree | credential_id | sim | sim |  |
| public.webauthn_credentials | webauthn_credentials_pkey | btree | id | sim | sim |  |
| public.webhook_deliveries | idx_webhook_deliveries_webhook_id | btree | webhook_id | não | sim |  |
| public.webhook_deliveries | webhook_deliveries_pkey | btree | id | sim | sim |  |
| public.webhook_events_processed | webhook_events_processed_event_id_provider_key | btree | event_id, provider | sim | sim |  |
| public.webhook_events_processed | webhook_events_processed_pkey | btree | id | sim | sim |  |
| public.webhook_inbound_failures | idx_webhook_inbound_failures_created | btree | created_at | não | sim |  |
| public.webhook_inbound_failures | webhook_inbound_failures_pkey | btree | id | sim | sim |  |

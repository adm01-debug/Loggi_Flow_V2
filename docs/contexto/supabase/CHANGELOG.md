# CHANGELOG do snapshot Supabase

Diff semântico gerado a cada coleta em que algo mudou.

## 2026-11-27 01:16 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_30`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_23`

## 2026-11-26 23:20 UTC

- **functions** alterado (1): `public.registrar_crash_ui(p_message text, p_stack_trace text, p_url text, p_metadata jsonb)`

## 2026-11-26 22:22 UTC

- **functions** adicionado (1): `public.registrar_crash_ui(p_message text, p_stack_trace text, p_url text, p_metadata jsonb)`
- **lints** adicionado (1): `rpc_anon_executable:public.registrar_crash_ui(p_message text, p_stack_trace text, p_url text, p_metadata jsonb)`
- **migrations** adicionado (1): `20261126220000_registrar_crash_ui_para_anonimo.sql_`

## 2026-11-26 21:22 UTC

- **functions** removido (1): `public.xp_for_level(lvl integer)`
- **migrations** adicionado (1): `20261126210000_remove_xp_for_level_sem_chamador.sql_`

## 2026-11-26 20:22 UTC

- **colunas** removido (73): `internal.mv_carrier_performance.entregas_no_prazo`, `internal.mv_carrier_performance.last_refresh`, `internal.mv_carrier_performance.nome_fantasia`, `internal.mv_carrier_performance.otif_percent`, `internal.mv_carrier_performance.total_entregas`, `internal.mv_carrier_performance.transportadora_id`, `internal.mv_carrier_performance.valor_total_frete`, `internal.mv_dashboard_metrics.coletas_com_divergencia`, `internal.mv_dashboard_metrics.coletas_em_transito`, `internal.mv_dashboard_metrics.coletas_finalizadas`, `internal.mv_dashboard_metrics.coletas_pendentes`, `internal.mv_dashboard_metrics.entregas_com_ocorrencia`, `internal.mv_dashboard_metrics.entregas_em_transito`, `internal.mv_dashboard_metrics.entregas_finalizadas`, `internal.mv_dashboard_metrics.entregas_pendentes`, `internal.mv_dashboard_metrics.last_refresh`, `internal.mv_dashboard_metrics.otif_rate`, `internal.mv_dashboard_metrics.singleton`, `internal.mv_dashboard_metrics.total_coletas`, `internal.mv_dashboard_metrics.total_entregas`, `internal.mv_dashboard_metrics.total_volume`, `internal.mv_dashboard_metrics.valor_total_frete`, `public.account_lockouts.created_at`, `public.account_lockouts.email`, `public.account_lockouts.failed_attempts`, `public.account_lockouts.id`, `public.account_lockouts.locked_until`, `public.account_lockouts.reason`, `public.account_lockouts.updated_at`, `public.allowed_ips.created_at`, `public.allowed_ips.created_by`, `public.allowed_ips.description`, `public.allowed_ips.id`, `public.allowed_ips.ip_address`, `public.allowed_ips.is_active`, `public.allowed_ips.updated_at`, `public.allowed_ips.user_id`, `public.driver_badges.badge_type`, `public.driver_badges.driver_id`, `public.driver_badges.id` … (+33)
- **constraints** removido (13): `public.account_lockouts.account_lockouts_pkey`, `public.allowed_ips.allowed_ips_pkey`, `public.allowed_ips.allowed_ips_user_id_fkey`, `public.driver_badges.driver_badges_driver_id_fkey`, `public.driver_badges.driver_badges_pkey`, `public.email_verification_tokens.email_verification_tokens_pkey`, `public.email_verification_tokens.email_verification_tokens_token_key`, `public.email_verification_tokens.email_verification_tokens_user_id_fkey`, `public.notification_templates.notification_templates_code_key`, `public.notification_templates.notification_templates_pkey`, `public.system_adr.system_adr_pkey`, `public.system_contract_schemas.system_contract_schemas_entity_name_key`, `public.system_contract_schemas.system_contract_schemas_pkey`
- **cron jobs** removido (1): `54:refresh-dashboard-views-5m`
- **functions** removido (4): `public.get_carrier_performance_fast()`, `public.get_dashboard_metrics_fast()`, `public.refresh_dashboard_views()`, `public.system_health_check()`
- **functions** alterado (5): `public.audit_log_trigger()`, `public.get_current_organization_id()`, `public.handle_updated_at()`, `public.has_permission(_user_id uuid, _permission_code text)`, `public.update_updated_at_column()`
- **grants** removido (21): `public.account_lockouts:anon`, `public.account_lockouts:authenticated`, `public.account_lockouts:service_role`, `public.allowed_ips:anon`, `public.allowed_ips:authenticated`, `public.allowed_ips:service_role`, `public.driver_badges:anon`, `public.driver_badges:authenticated`, `public.driver_badges:service_role`, `public.email_verification_tokens:anon`, `public.email_verification_tokens:authenticated`, `public.email_verification_tokens:service_role`, `public.notification_templates:anon`, `public.notification_templates:authenticated`, `public.notification_templates:service_role`, `public.system_adr:anon`, `public.system_adr:authenticated`, `public.system_adr:service_role`, `public.system_contract_schemas:anon`, `public.system_contract_schemas:authenticated`, `public.system_contract_schemas:service_role`
- **indexes** removido (17): `internal.mv_carrier_performance_otif_percent_idx`, `internal.mv_carrier_performance_transportadora_id_idx`, `internal.mv_dashboard_metrics_singleton_idx`, `public.account_lockouts_pkey`, `public.allowed_ips_pkey`, `public.driver_badges_pkey`, `public.email_verification_tokens_pkey`, `public.email_verification_tokens_token_key`, `public.idx_account_lockouts_email`, `public.idx_allowed_ips_user_id`, `public.idx_driver_badges_driver_id`, `public.idx_email_verification_tokens_user_id`, `public.notification_templates_code_key`, `public.notification_templates_pkey`, `public.system_adr_pkey`, `public.system_contract_schemas_entity_name_key`, `public.system_contract_schemas_pkey`
- **lints** removido (12): `policy_auth_fn_not_wrapped:public.account_lockouts.Admins can manage lockouts`, `policy_auth_fn_not_wrapped:public.account_lockouts.Admins can view lockouts`, `policy_auth_fn_not_wrapped:public.allowed_ips.Admins can manage all allowed IPs`, `policy_auth_fn_not_wrapped:public.allowed_ips.Delete own IPs`, `policy_auth_fn_not_wrapped:public.allowed_ips.Insert own IPs`, `policy_auth_fn_not_wrapped:public.allowed_ips.Update own IPs`, `policy_auth_fn_not_wrapped:public.allowed_ips.Users can view their own allowed IPs`, `policy_auth_fn_not_wrapped:public.driver_badges.Admins can manage driver badges`, `policy_auth_fn_not_wrapped:public.driver_badges.Drivers can view their own badges`, `policy_auth_fn_not_wrapped:public.email_verification_tokens.Admins can manage verification tokens`, `policy_auth_fn_not_wrapped:public.notification_templates.Admins manage notification_templates`, `policy_auth_fn_not_wrapped:public.system_adr.Admins manage ADRs`
- **migrations** adicionado (2): `20261126170000_remove_tabelas_mortas_sem_consumidor.sql_`, `20261126190000_remove_camada_fast_metrics_sem_leitor.sql_`
- **policies (RLS)** removido (14): `public.account_lockouts.Admins can manage lockouts`, `public.account_lockouts.Admins can view lockouts`, `public.allowed_ips.Admins can manage all allowed IPs`, `public.allowed_ips.Delete own IPs`, `public.allowed_ips.Insert own IPs`, `public.allowed_ips.Update own IPs`, `public.allowed_ips.Users can view their own allowed IPs`, `public.driver_badges.Admins can manage driver badges`, `public.driver_badges.Drivers can view their own badges`, `public.email_verification_tokens.Admins can manage verification tokens`, `public.notification_templates.Admins manage notification_templates`, `public.notification_templates.Authenticated read notification_templates`, `public.system_adr.Admins manage ADRs`, `public.system_contract_schemas.Allow authenticated read for schemas`
- **tabelas** removido (7): `public.account_lockouts`, `public.allowed_ips`, `public.driver_badges`, `public.email_verification_tokens`, `public.notification_templates`, `public.system_adr`, `public.system_contract_schemas`
- **triggers** removido (9): `public.account_lockouts.audit_log_trigger`, `public.account_lockouts.update_account_lockouts_updated_at`, `public.allowed_ips.audit_log_trigger`, `public.allowed_ips.update_allowed_ips_updated_at`, `public.email_verification_tokens.audit_log_trigger`, `public.notification_templates.trg_notification_templates_updated_at`, `public.system_adr.audit_log_trigger`, `public.system_adr.update_system_adr_updated_at`, `public.system_contract_schemas.trg_system_contract_schemas_updated_at`
- **views** removido (2): `internal.mv_carrier_performance`, `internal.mv_dashboard_metrics`

## 2026-11-26 14:17 UTC

- **migrations** adicionado (1): `20261126160000_bitrix_spa_ocorrencias_no_business_rules.sql_`

## 2026-11-26 13:18 UTC

- **functions** alterado (10): `public.alert_slow_queries(threshold_ms integer)`, `public.alert_slow_queries(threshold_ms numeric)`, `public.cleanup_old_contract_test_logs(days_to_keep integer)`, `public.count_prediction_breach_days(_target numeric, _carrier text)`, `public.count_prediction_breach_days_bulk(_pairs jsonb)`, `public.fn_tr_valida_transicao_coleta()`, `public.fn_tr_valida_transicao_entrega()`, `public.fn_valida_transicao_coleta(p_de coleta_status, p_para coleta_status)`, `public.fn_valida_transicao_entrega(p_de entrega_status, p_para entrega_status)`, `public.get_public_tracking(p_code text)`
- **lints** removido (6): `rpc_anon_executable:public.alert_slow_queries(threshold_ms numeric)`, `rpc_anon_executable:public.cleanup_old_contract_test_logs(days_to_keep integer)`, `rpc_anon_executable:public.count_prediction_breach_days(_target numeric, _carrier text)`, `rpc_anon_executable:public.count_prediction_breach_days_bulk(_pairs jsonb)`, `rpc_anon_executable:public.fn_valida_transicao_coleta(p_de coleta_status, p_para coleta_status)`, `rpc_anon_executable:public.fn_valida_transicao_entrega(p_de entrega_status, p_para entrega_status)`
- **migrations** adicionado (2): `20261126140000_revoga_execute_publico_funcoes_internas.sql_`, `20261126150000_execute_anon_por_default_e_retencao.sql_`

## 2026-11-26 12:21 UTC

- **cron jobs** adicionado (2): `102:purge-webhook-inbound-failures-daily`, `103:cleanup-contract-test-logs-daily`
- **functions** adicionado (1): `public.cleanup_old_contract_test_logs(days_to_keep integer)`
- **functions** removido (7): `public.audit_trigger_func()`, `public.fn_audit_trigger()`, `public.jsonb_recursive_merge(a jsonb, b jsonb)`, `public.tr_increment_version()`, `public.update_fretes_internos_updated_at()`, `public.update_performance_metrics()`, `public.validate_payload_schema(p_entity_name text, p_payload jsonb)`
- **functions** alterado (2): `public.add_user_xp(p_user_id uuid, p_xp_amount integer, p_coins_amount integer)`, `public.purge_webhook_inbound_failures(_keep_days integer)`
- **lints** adicionado (1): `rpc_anon_executable:public.cleanup_old_contract_test_logs(days_to_keep integer)`
- **migrations** adicionado (2): `20261126120000_retencao_logs_contrato_e_webhook.sql_`, `20261126130000_remove_funcoes_orfas_sem_chamador.sql_`

## 2026-11-26 11:13 UTC

- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_29`
- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_22`

## 2026-11-25 22:27 UTC

- **grants** alterado (268): `public.account_lockouts:anon`, `public.account_lockouts:authenticated`, `public.achievements:anon`, `public.achievements:authenticated`, `public.ai_chat_messages:anon`, `public.ai_chat_messages:authenticated`, `public.ai_delay_predictions:anon`, `public.ai_delay_predictions:authenticated`, `public.alertas_custo:anon`, `public.alertas_custo:authenticated`, `public.allowed_ips:anon`, `public.allowed_ips:authenticated`, `public.architecture_decisions:anon`, `public.architecture_decisions:authenticated`, `public.audit_logs:anon`, `public.audit_logs:authenticated`, `public.audit_logs_y2026m07:anon`, `public.audit_logs_y2026m07:authenticated`, `public.audit_logs_y2026m08:anon`, `public.audit_logs_y2026m08:authenticated`, `public.audit_logs_y2026m09:anon`, `public.audit_logs_y2026m09:authenticated`, `public.audit_logs_y2026m10:anon`, `public.audit_logs_y2026m10:authenticated`, `public.audit_logs_y2026m11:anon`, `public.audit_logs_y2026m11:authenticated`, `public.audit_logs_y2026m12:anon`, `public.audit_logs_y2026m12:authenticated`, `public.audit_logs_y2027m01:anon`, `public.audit_logs_y2027m01:authenticated`, `public.audit_logs_y2027m02:anon`, `public.audit_logs_y2027m02:authenticated`, `public.audit_logs_y2027m03:anon`, `public.audit_logs_y2027m03:authenticated`, `public.audit_logs_y2027m04:anon`, `public.audit_logs_y2027m04:authenticated`, `public.audit_logs_y2027m05:anon`, `public.audit_logs_y2027m05:authenticated`, `public.audit_logs_y2027m06:anon`, `public.audit_logs_y2027m06:authenticated` … (+228)
- **indexes** removido (4): `public.idx_coletas_status_active`, `public.idx_entregas_cliente_status`, `public.idx_entregas_status_active`, `public.idx_entregas_status_composite`
- **migrations** adicionado (2): `20261125162000_drop_4_indices_redundantes.sql_`, `20261125183109_storage_ocorrencias_e_grants_anon.sql_`
- **policies (RLS)** adicionado (8): `storage.objects.Documents: entregas atualizacao`, `storage.objects.Documents: entregas leitura`, `storage.objects.Documents: entregas remocao`, `storage.objects.Documents: entregas upload`, `storage.objects.Ocorrencias fotos: atualizacao autenticada`, `storage.objects.Ocorrencias fotos: leitura autenticada`, `storage.objects.Ocorrencias fotos: remocao autenticada`, `storage.objects.Ocorrencias fotos: upload autenticado`
- **storage buckets** adicionado (1): `ocorrencias-fotos`

## 2026-11-25 15:07 UTC

- **functions** removido (1): `public.reconcile_pending_freights()`
- **indexes** adicionado (1): `public.ux_logistica_reversa_codigo_rastreio`
- **migrations** adicionado (2): `20261125154000_codigo_rastreio_reverso_unico.sql_`, `20261125154100_drop_reconcile_pending_freights.sql_`

## 2026-11-25 13:15 UTC

- **realtime** removido (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_21`

## 2026-11-25 12:23 UTC

- **migrations** adicionado (1): `20261125093000_webhook_inbound_failures.sql_`
- **realtime** adicionado (1): `supabase_realtime_messages_publication:realtime.messages_2026_11_28`

## 2026-11-25 11:18 UTC

- **colunas** adicionado (7): `public.webhook_inbound_failures.created_at`, `public.webhook_inbound_failures.error_message`, `public.webhook_inbound_failures.event_id`, `public.webhook_inbound_failures.id`, `public.webhook_inbound_failures.provider`, `public.webhook_inbound_failures.receiver`, `public.webhook_inbound_failures.response_status`
- **constraints** adicionado (1): `public.webhook_inbound_failures.webhook_inbound_failures_pkey`
- **functions** adicionado (1): `public.purge_webhook_inbound_failures(_keep_days integer)`
- **functions** alterado (1): `public.has_role(_user_id uuid, _role app_role)`
- **grants** adicionado (3): `public.webhook_inbound_failures:anon`, `public.webhook_inbound_failures:authenticated`, `public.webhook_inbound_failures:service_role`
- **indexes** adicionado (2): `public.idx_webhook_inbound_failures_created`, `public.webhook_inbound_failures_pkey`
- **lints** adicionado (1): `policy_auth_fn_not_wrapped:public.webhook_inbound_failures.Admins can view webhook inbound failures`
- **migrations** adicionado (1): `20261125093000_webhook_inbound_failures`
- **policies (RLS)** adicionado (2): `public.webhook_inbound_failures.Admins can view webhook inbound failures`, `public.webhook_inbound_failures.System can insert webhook inbound failures`
- **tabelas** adicionado (1): `public.webhook_inbound_failures`

## 2026-11-24 21:13 UTC

- **colunas** adicionado (1): `public.contract_test_logs.payload_hash`
- **migrations** adicionado (258): `20241231000000_saved_filters`, `20241231000001_entity_versions`, `20251215123841_69fdc13e-5215-49b0-abfb-1c49d264c2a0`, `20251215124034_3bcd1ef0-bd84-4ebc-a08a-5ac4acab56c7`, `20251215125853_8293a0b4-7a49-4600-ae63-dcb1e921209b`, `20251215143615_33d220a2-7a32-4889-b3a5-4bcf83b059b3`, `20251215160229_75402642-8288-46ce-ba60-ed3e199c5315`, `20251215162356_35cbc8c7-ef9f-4c75-bb60-1ab23b1b5b33`, `20251215164058_89683cdc-a695-43f2-9f95-0d22c54a80f3`, `20251215170138_24ca6dc5-0aff-4551-a6d2-d7b1d566a81e`, `20251215171825_f479f910-1d05-4e21-82ce-425be83fa2b3`, `20251215181739_b3add0a8-aecc-4ff2-a080-f3ec18b743ae`, `20251215184000_113427b8-eb1e-4e73-b01e-76ff27adee4d`, `20251215185018_768705ea-a97d-45c1-9f45-e66b13e5cb50`, `20251220115808_create_fretes_internos`, `20251220122236_gamification_triggers`, `20251220122500_notifications_table`, `20251220130822_3d128998-ba4f-4d86-a26a-5b5dafce7ab7`, `20251220131157_984216cb-75a5-455e-b120-bf0418972c95`, `20251220131539_fa5f8650-9dcb-4a17-bd00-f7ee9de61e27`, `20251220140342_379b1bd3-1c54-4a5d-b031-d7c0a1e4eee7`, `20251220153353_rls_policies`, `20251220164816_audit_log_triggers`, `20251220173204_comments_table`, `20251220173229_storage_buckets`, `20251220181932_eb8f162b-a681-4397-b0bf-4e4ed0a98808`, `20251220183946_e1853d11-807f-46f3-b3f3-706068a19216`, `20251221200001_saved_filters`, `20251221200002_entity_versions`, `20251221200003_activity_logs`, `20251224023625_cb7c0f38-8bb9-4611-8c3b-c3b13cabed0a`, `20251228173937_3ced2e89-47d9-47f8-b1e4-afab0c1a7139`, `20251228181717_767d69f0-60bc-473c-a2af-938767b9e2a3`, `20251228184823_f22f6b82-8ef3-4375-9b50-5752c416685c`, `20251228190317_cfb847d5-881c-4051-b663-c9d4a442b045`, `20251231024516_b9076c5f-52f8-44c1-a7e6-7e461078c40a`, `20251231024957_3a8f7163-cfe2-446c-9638-1a25aba7c5de`, `20251231115844_28abc076-33b6-4500-bdea-6cb172ea1ba8`, `20251231122656_7582cddf-ba09-4ac8-923b-326123a07baa`, `20251231124450_1019d14d-6c2b-4cc5-bcc3-c26c9c58a2dd` … (+218)
- **migrations** removido (256): `20241231000000_saved_filters_`, `20241231000001_entity_versions_`, `20251215123841_69fdc13e-5215-49b0-abfb-1c49d264c2a0_`, `20251215124034_3bcd1ef0-bd84-4ebc-a08a-5ac4acab56c7_`, `20251215125853_8293a0b4-7a49-4600-ae63-dcb1e921209b_`, `20251215143615_33d220a2-7a32-4889-b3a5-4bcf83b059b3_`, `20251215160229_75402642-8288-46ce-ba60-ed3e199c5315_`, `20251215162356_35cbc8c7-ef9f-4c75-bb60-1ab23b1b5b33_`, `20251215164058_89683cdc-a695-43f2-9f95-0d22c54a80f3_`, `20251215170138_24ca6dc5-0aff-4551-a6d2-d7b1d566a81e_`, `20251215171825_f479f910-1d05-4e21-82ce-425be83fa2b3_`, `20251215181739_b3add0a8-aecc-4ff2-a080-f3ec18b743ae_`, `20251215184000_113427b8-eb1e-4e73-b01e-76ff27adee4d_`, `20251215185018_768705ea-a97d-45c1-9f45-e66b13e5cb50_`, `20251220115808_create_fretes_internos_`, `20251220122236_gamification_triggers_`, `20251220122500_notifications_table_`, `20251220130822_3d128998-ba4f-4d86-a26a-5b5dafce7ab7_`, `20251220131157_984216cb-75a5-455e-b120-bf0418972c95_`, `20251220131539_fa5f8650-9dcb-4a17-bd00-f7ee9de61e27_`, `20251220140342_379b1bd3-1c54-4a5d-b031-d7c0a1e4eee7_`, `20251220153353_rls_policies_`, `20251220164816_audit_log_triggers_`, `20251220173204_comments_table_`, `20251220173229_storage_buckets_`, `20251220181932_eb8f162b-a681-4397-b0bf-4e4ed0a98808_`, `20251220183946_e1853d11-807f-46f3-b3f3-706068a19216_`, `20251221200001_saved_filters_`, `20251221200002_entity_versions_`, `20251221200003_activity_logs_`, `20251224023625_cb7c0f38-8bb9-4611-8c3b-c3b13cabed0a_`, `20251228173937_3ced2e89-47d9-47f8-b1e4-afab0c1a7139_`, `20251228181717_767d69f0-60bc-473c-a2af-938767b9e2a3_`, `20251228184823_f22f6b82-8ef3-4375-9b50-5752c416685c_`, `20251228190317_cfb847d5-881c-4051-b663-c9d4a442b045_`, `20251231024516_b9076c5f-52f8-44c1-a7e6-7e461078c40a_`, `20251231024957_3a8f7163-cfe2-446c-9638-1a25aba7c5de_`, `20251231115844_28abc076-33b6-4500-bdea-6cb172ea1ba8_`, `20251231122656_7582cddf-ba09-4ac8-923b-326123a07baa_`, `20251231124450_1019d14d-6c2b-4cc5-bcc3-c26c9c58a2dd_` … (+216)
- **policies (RLS)** adicionado (3): `public.bio_sync_alert_rules.Regras de alerta visíveis a usuários autenticados`, `public.system_heartbeat.Heartbeat visível a usuários autenticados`, `public.user_ranks.Ranks visíveis a usuários autenticados`
- **policies (RLS)** removido (3): `public.bio_sync_alert_rules.Rules are viewable by everyone`, `public.system_heartbeat.All users can view heartbeat`, `public.user_ranks.Ranks são visíveis por todos`
- **roles** adicionado (1): `cli_login_postgres`

## 2026-11-24 17:13 UTC

- **functions** adicionado (1): `public.count_prediction_breach_days_bulk(_pairs jsonb)`
- **indexes** removido (16): `public.audit_logs_y2026m07_record_id_table_name_idx`, `public.audit_logs_y2026m08_record_id_table_name_idx`, `public.audit_logs_y2026m09_record_id_table_name_idx`, `public.audit_logs_y2026m10_record_id_table_name_idx`, `public.audit_logs_y2026m11_record_id_table_name_idx`, `public.audit_logs_y2026m12_record_id_table_name_idx`, `public.audit_logs_y2027m01_record_id_table_name_idx`, `public.audit_logs_y2027m02_record_id_table_name_idx`, `public.audit_logs_y2027m03_record_id_table_name_idx`, `public.audit_logs_y2027m04_record_id_table_name_idx`, `public.audit_logs_y2027m05_record_id_table_name_idx`, `public.audit_logs_y2027m06_record_id_table_name_idx`, `public.audit_logs_y2027m07_record_id_table_name_idx`, `public.idx_audit_logs_record_id_table`, `public.idx_coletas_transportadora`, `public.idx_entregas_transportadora`
- **lints** adicionado (1): `rpc_anon_executable:public.count_prediction_breach_days_bulk(_pairs jsonb)`
- **migrations** adicionado (2): `20261124133000_count_prediction_breach_days_bulk.sql_`, `20261124150000_index_dedupe_transportadora_audit.sql_`

## 2026-11-24 13:40 UTC

- Snapshot inicial.


# Relacionamentos (chaves estrangeiras)


| de | colunas | para | colunas | on delete | on update |
|---|---|---|---|---|---|
| public.alertas_custo | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.alertas_custo | transportadora_id | public.transportadoras | id | CASCADE | NO ACTION |
| public.bitrix_sync_logs | config_id | public.bitrix_sync_config | id | NO ACTION | NO ACTION |
| public.business_rules | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.business_rules_config | updated_by | auth.users | id | NO ACTION | NO ACTION |
| public.carrier_rankings | transportadora_id | public.transportadoras | id | CASCADE | NO ACTION |
| public.coletas | fornecedor_id | public.fornecedores | id | SET NULL | NO ACTION |
| public.coletas | transportadora_id | public.transportadoras | id | SET NULL | NO ACTION |
| public.comments | user_id | auth.users | id | CASCADE | NO ACTION |
| public.conciliacao_itens_importados | conciliacao_id | public.conciliacoes | id | CASCADE | NO ACTION |
| public.conciliacao_itens_importados | conciliado_por | auth.users | id | NO ACTION | NO ACTION |
| public.conciliacoes | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.cotacoes_frete | entrega_id | public.entregas | id | NO ACTION | NO ACTION |
| public.cotacoes_frete | transportadora_id | public.transportadoras | id | NO ACTION | NO ACTION |
| public.cotacoes_multicanal | transportadora_id | public.transportadoras | id | CASCADE | NO ACTION |
| public.delivery_receipt_audit | delivery_id | public.entregas | id | CASCADE | NO ACTION |
| public.delivery_receipt_audit | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.entregas | cliente_id | public.clientes | id | NO ACTION | NO ACTION |
| public.entregas | transportadora_id | public.transportadoras | id | NO ACTION | NO ACTION |
| public.error_events | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.freight_decisions | selected_carrier_id | public.transportadoras | id | NO ACTION | NO ACTION |
| public.freight_decisions | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.freight_integration_mappings | transportadora_id | public.transportadoras | id | NO ACTION | NO ACTION |
| public.freight_webhooks | transportadora_id | public.transportadoras | id | CASCADE | NO ACTION |
| public.fretes_internos | organization_id | public.organizations | id | NO ACTION | NO ACTION |
| public.geo_access_rules | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.geo_blocking_rules | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.geo_blocking_settings | updated_by | auth.users | id | NO ACTION | NO ACTION |
| public.index_proposals | applied_by | auth.users | id | NO ACTION | NO ACTION |
| public.index_proposals | proposed_by | auth.users | id | NO ACTION | NO ACTION |
| public.kanban_history | action_by | auth.users | id | NO ACTION | NO ACTION |
| public.kanban_history | delivery_id | public.entregas | id | CASCADE | NO ACTION |
| public.logistica_reversa | cliente_id | public.clientes | id | NO ACTION | NO ACTION |
| public.logistica_reversa | created_by | auth.users | id | NO ACTION | NO ACTION |
| public.logistica_reversa | entrega_id | public.entregas | id | NO ACTION | NO ACTION |
| public.mitigation_actions | user_id | auth.users | id | CASCADE | NO ACTION |
| public.notificacoes_custo | alerta_id | public.alertas_custo | id | CASCADE | NO ACTION |
| public.notifications | user_id | auth.users | id | CASCADE | NO ACTION |
| public.ocorrencias | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.ocorrencias | entrega_id | public.entregas | id | NO ACTION | NO ACTION |
| public.password_reset_requests | user_id | auth.users | id | CASCADE | NO ACTION |
| public.prediction_accuracy_settings | user_id | auth.users | id | CASCADE | NO ACTION |
| public.profiles | id | auth.users | id | CASCADE | NO ACTION |
| public.profiles | organization_id | public.organizations | id | NO ACTION | NO ACTION |
| public.push_subscriptions | user_id | auth.users | id | CASCADE | NO ACTION |
| public.rastreamento_alertas | coleta_id | public.coletas | id | SET NULL | NO ACTION |
| public.rastreamento_historico | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rastreamento_historico_y2026m01 | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rastreamento_historico_y2026m02 | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rastreamento_historico_y2026m03 | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rastreamento_historico_y2026m04 | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rastreamento_historico_y2026m05 | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rastreamento_historico_y2026m06 | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rastreamento_historico_y2026m07 | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rastreamento_historico_y2026m08 | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rastreamento_historico_y2026m09 | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rastreamento_historico_y2026m10 | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rastreamento_historico_y2026m11 | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rastreamento_historico_y2026m12 | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rastreamento_historico_y2027m01 | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rastreamento_historico_y2027m02 | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rastreamento_historico_y2027m03 | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rastreamento_historico_y2027m04 | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rastreamento_historico_y2027m05 | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rastreamento_historico_y2027m06 | coleta_id | public.coletas | id | NO ACTION | NO ACTION |
| public.rate_limit_logs | user_id | auth.users | id | SET NULL | NO ACTION |
| public.remediation_actions | applied_by | auth.users | id | SET NULL | NO ACTION |
| public.reward_purchases | reward_item_id | public.reward_items | id | CASCADE | NO ACTION |
| public.role_permissions | permission_id | public.permissions | id | CASCADE | NO ACTION |
| public.rule_execution_logs | rule_id | public.business_rules | id | CASCADE | NO ACTION |
| public.scheduled_reports | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.security_events | user_id | auth.users | id | SET NULL | NO ACTION |
| public.tabelas_frete | transportadora_id | public.transportadoras | id | CASCADE | NO ACTION |
| public.telemetry_logs | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.transportadora_rotas | transportadora_id | public.transportadoras | id | CASCADE | NO ACTION |
| public.user_achievements | achievement_id | public.achievements | id | CASCADE | NO ACTION |
| public.user_achievements | user_id | auth.users | id | CASCADE | NO ACTION |
| public.user_levels | rank_id | public.user_ranks | id | NO ACTION | NO ACTION |
| public.user_levels | user_id | auth.users | id | CASCADE | NO ACTION |
| public.user_panel_preferences | user_id | auth.users | id | CASCADE | NO ACTION |
| public.user_roles | user_id | auth.users | id | CASCADE | NO ACTION |
| public.user_sessions | user_id | auth.users | id | CASCADE | NO ACTION |
| public.webauthn_challenges | user_id | auth.users | id | CASCADE | NO ACTION |
| public.webauthn_credentials | user_id | auth.users | id | CASCADE | NO ACTION |
| public.webhook_deliveries | webhook_id | public.client_webhooks | id | CASCADE | NO ACTION |


## Diagrama ER (Mermaid)

```mermaid
erDiagram
    audit_tmp_cfg {
        text k PK
        text v
    }
    audit_tmp_job_test {
        text fn PK
        boolean ok
        text result
        integer ms
        timestamp_with_time_zone at
    }
    audit_tmp_load_log {
        text name
        text tbl
        integer inserted
        text err
        timestamp_with_time_zone at
    }
    audit_tmp_manifest {
        text side
        text section
        text key
        text def
    }
    audit_tmp_req {
        text name PK
        bigint request_id
        timestamp_with_time_zone created_at
    }
    audit_tmp_seed_backup {
        text tbl PK
        integer n
        jsonb rows
        timestamp_with_time_zone taken_at
    }
    audit_tmp_sql {
        text name PK
        text body
    }
    internal_query_baseline {
        bigint id PK
        timestamp_with_time_zone captured_at
        bigint queryid
        text query_text
        bigint calls
        double_precision total_exec_time
        double_precision mean_exec_time
        bigint rows_processed
    }
    public_achievements {
        uuid id PK
        text code
        text name
        text description
        text icon
        text category
        text rarity
        integer xp_reward
        integer coins_reward
        text requirement_type
        integer requirement_value
        timestamp_with_time_zone created_at
    }
    public_ai_chat_messages {
        uuid id PK
        uuid user_id
        text role
        text content
        jsonb metadata
        timestamp_with_time_zone created_at
    }
    public_ai_delay_predictions {
        uuid id PK
        uuid entity_id
        text entity_type
        jsonb prediction_data
        text risco
        integer probabilidade_atraso
        timestamp_with_time_zone analyzed_at
        timestamp_with_time_zone created_at
    }
    public_alertas_custo {
        uuid id PK
        text tipo
        uuid transportadora_id FK
        text estado_destino
        numeric limite_mensal
        numeric limite_por_entrega
        boolean ativo
        integer notificar_percentual
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
        uuid created_by FK
    }
    public_architecture_decisions {
        uuid id PK
        text title
        text status
        text context
        text decision
        text consequences
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_audit_logs {
        uuid id PK
        text table_name
        text record_id
        text action
        jsonb old_data
        jsonb new_data
        text__ changed_fields
        uuid user_id
        text user_email
        text user_name
        text ip_address
        text user_agent
        timestamp_with_time_zone created_at PK
    }
    public_automation_audit_logs {
        uuid id PK
        uuid rule_id
        uuid entity_id
        text entity_type
        text action_taken
        jsonb payload
        text status
        text error_message
        integer execution_time_ms
        timestamp_with_time_zone created_at
    }
    public_bio_sync_alert_rules {
        uuid id PK
        text vehicle_id
        integer bpm_warning_threshold
        integer bpm_critical_threshold
        text fatigue_warning_threshold
        integer cooldown_minutes
        boolean is_active
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_bio_sync_telemetry {
        uuid id PK
        text driver_id
        text vehicle_id
        integer heart_rate
        text fatigue_index
        timestamp_with_time_zone timestamp
        timestamp_with_time_zone created_at
        text severity
        text cause
        text suggested_action
    }
    public_bitrix_sync_config {
        uuid id PK
        text webhook_url
        text client_id
        text client_secret
        text access_token
        text refresh_token
        timestamp_with_time_zone last_sync_at
        boolean is_active
        integer sync_interval_minutes
        jsonb field_mapping
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_bitrix_sync_logs {
        uuid id PK
        uuid config_id FK
        text status
        integer synced_items_count
        text error_message
        jsonb details
        timestamp_with_time_zone created_at
    }
    public_business_rules {
        uuid id PK
        text name
        text description
        text entity_type
        text trigger_event
        jsonb conditions
        jsonb actions
        boolean is_active
        integer priority
        uuid created_by FK
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_business_rules_config {
        text key PK
        jsonb value
        text description
        uuid updated_by FK
        timestamp_with_time_zone updated_at
    }
    public_carrier_rankings {
        uuid id PK
        uuid transportadora_id FK
        text period
        integer total_shipments
        integer on_time_shipments
        numeric_5_2_ sla_percentage
        numeric_5_2_ efficiency_score
        text rank_tier
        timestamp_with_time_zone last_updated
    }
    public_client_webhooks {
        uuid id PK
        text url
        text secret
        text__ events
        boolean active
        text description
        uuid created_by
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_clientes {
        uuid id PK
        text razao_social
        text cnpj
        text nome_fantasia
        text endereco_completo
        text cidade
        text estado
        text cep
        text contato_nome
        text contato_telefone
        text contato_email
        text restricoes_entrega
        text horario_entrega
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
        timestamp_with_time_zone deleted_at
    }
    public_coletas {
        uuid id PK
        text numero_coleta
        uuid fornecedor_id FK
        text endereco_coleta
        text contato_coleta
        coleta_tipo tipo_coleta
        uuid transportadora_id FK
        timestamp_with_time_zone data_prevista_coleta
        timestamp_with_time_zone data_efetiva_coleta
        integer qtd_volumes
        numeric_10_2_ peso_estimado_kg
        text codigo_rastreamento
        text link_rastreamento
        text comprovante_coleta_url
        coleta_status status
        text observacoes
        integer qtd_recebida
        numeric_5_2_ divergencia_percentual
        text nf_fornecedor
        text nf_anexo_url
        text responsavel_recebimento
        timestamp_with_time_zone data_recebimento
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
        timestamp_with_time_zone deleted_at
        text _mais_colunas_
    }
    public_comments {
        uuid id PK
        text content
        text entity_type
        uuid entity_id
        uuid user_id FK
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_conciliacao_itens_importados {
        uuid id PK
        uuid conciliacao_id FK
        integer linha_arquivo
        character_varying_100_ referencia_externa
        text descricao
        date data_documento
        numeric_12_2_ valor
        character_varying_255_ transportadora_nome
        jsonb dados_originais
        character_varying_30_ status
        uuid item_sistema_id
        numeric_12_2_ diferenca_valor
        text observacoes
        timestamp_with_time_zone conciliado_em
        uuid conciliado_por FK
        timestamp_with_time_zone created_at
    }
    public_conciliacoes {
        uuid id PK
        character_varying_50_ tipo
        character_varying_255_ nome
        text descricao
        date periodo_inicio
        date periodo_fim
        character_varying_30_ status
        integer total_itens_importados
        integer total_itens_conciliados
        integer total_divergencias
        numeric_12_2_ valor_total_importado
        numeric_12_2_ valor_total_sistema
        numeric_12_2_ diferenca_total
        uuid created_by FK
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_contract_test_logs {
        uuid id PK
        text entity_name
        jsonb payload
        boolean is_valid
        jsonb errors
        integer latency_ms
        timestamp_with_time_zone created_at
        text payload_hash
    }
    public_cotacoes_frete {
        uuid id PK
        uuid entrega_id FK
        uuid transportadora_id FK
        numeric_10_2_ valor
        integer prazo_dias
        boolean selecionada
        text observacoes
        timestamp_with_time_zone created_at
        integer version
    }
    public_cotacoes_multicanal {
        uuid id PK
        uuid user_id
        uuid transportadora_id FK
        text canal
        text status
        text origem_estado
        text origem_cidade
        text destino_estado
        text destino_cidade
        numeric peso_kg
        integer volumes
        numeric valor_mercadoria
        numeric valor_cotado
        integer prazo_dias
        text observacoes
        timestamp_with_time_zone expires_at
        timestamp_with_time_zone responded_at
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
        integer version
        jsonb workflow_logs
        integer retry_count
        jsonb normalization_data
    }
    public_db_health_score_history {
        uuid id PK
        timestamp_with_time_zone captured_at
        numeric overall_score
        text grade
        numeric slo_score
        numeric anomaly_score
        numeric mttr_score
        numeric capacity_score
        jsonb details
        timestamp_with_time_zone created_at
    }
    public_db_health_snapshots {
        uuid id PK
        timestamp_with_time_zone created_at
        integer active_connections
        integer total_connections
        bigint db_size_bytes
        numeric cache_hit_ratio
        bigint deadlocks
        bigint wal_size_bytes
        jsonb metadata
    }
    public_db_slo_daily {
        uuid id PK
        date day
        integer samples
        numeric connection_slo_pct
        numeric cache_slo_pct
        numeric deadlock_free_pct
        numeric overall_slo_pct
        timestamp_with_time_zone computed_at
    }
    public_delay_predictions_history {
        uuid id PK
        uuid entity_id
        text entity_type
        text entity_numero
        text risco
        integer probabilidade_atraso
        numeric_6_2_ horas_estimadas_atraso
        jsonb motivos
        jsonb recomendacoes
        jsonb fatores
        timestamp_with_time_zone predicted_at
        timestamp_with_time_zone confirmed_at
        boolean was_accurate
        numeric_6_2_ actual_delay_hours
        timestamp_with_time_zone created_at
        text transportadora
    }
    public_delivery_receipt_audit {
        uuid id PK
        uuid delivery_id FK
        uuid user_id FK
        text file_name
        bigint file_size
        text file_type
        text storage_path
        text upload_status
        text ocr_status
        text error_message
        timestamp_with_time_zone created_at
    }
    public_entregas {
        uuid id PK
        text numero_entrega
        uuid cliente_id FK
        text endereco_entrega
        text contato_cliente
        uuid transportadora_id FK
        numeric_10_2_ valor_frete
        frete_tipo tipo_frete
        text nf_remessa
        text nf_remessa_url
        text box_alocado
        timestamp_with_time_zone data_despacho
        text codigo_rastreamento
        text link_rastreamento
        timestamp_with_time_zone previsao_entrega
        timestamp_with_time_zone data_entrega_efetiva
        text recebedor
        text comprovante_entrega_url
        entrega_status status
        text observacoes
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
        numeric_10_8_ latitude
        numeric_11_8_ longitude
        timestamp_with_time_zone geocoded_at
        text _mais_colunas_
    }
    public_error_events {
        uuid id PK
        uuid user_id FK
        text error_message
        text stack_trace
        jsonb context
        text severity
        timestamp_with_time_zone created_at
    }
    public_feature_flags {
        uuid id PK
        text key
        boolean is_enabled
        text description
        jsonb metadata
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_fornecedores {
        uuid id PK
        text razao_social
        text cnpj
        text nome_fantasia
        text endereco_completo
        text cidade
        text estado
        text cep
        text contato_nome
        text contato_telefone
        text contato_email
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
        timestamp_with_time_zone deleted_at
    }
    public_freight_decisions {
        uuid id PK
        uuid user_id FK
        jsonb request_params
        uuid selected_carrier_id FK
        text selected_carrier_name
        jsonb recommendations
        jsonb rule_applied
        text status
        text error_message
        timestamp_with_time_zone created_at
    }
    public_freight_integration_mappings {
        uuid id PK
        uuid transportadora_id FK
        text source_type
        jsonb mapping_config
        boolean is_active
        timestamp_with_time_zone created_at
    }
    public_freight_selection_rules {
        uuid id PK
        text event_type
        integer max_sla_days
        numeric price_weight
        numeric time_weight
        boolean is_active
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
        numeric performance_weight
        boolean is_default
    }
    public_freight_webhooks {
        uuid id PK
        uuid transportadora_id FK
        text endpoint_url
        text secret_key
        text event_type
        boolean is_active
        timestamp_with_time_zone last_called_at
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_fretes_internos {
        uuid id PK
        text origem
        text destino
        text motorista
        integer quantidade_itens
        frete_interno_status status
        timestamp_with_time_zone previsao_entrega
        timestamp_with_time_zone data_entrega_efetiva
        integer xp_reward
        text observacoes
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
        uuid organization_id FK
        timestamp_with_time_zone deleted_at
    }
    public_geo_access_rules {
        uuid id PK
        character_varying_2_ country_code
        character_varying_100_ country_name
        boolean is_active
        timestamp_with_time_zone created_at
        uuid created_by FK
    }
    public_geo_blocked_attempts {
        uuid id PK
        character_varying_45_ ip_address
        character_varying_2_ country_code
        character_varying_100_ country_name
        character_varying_255_ email
        text user_agent
        timestamp_with_time_zone created_at
    }
    public_geo_blocking_rules {
        uuid id PK
        text country_code
        text country_name
        text rule_type
        text description
        boolean is_active
        uuid created_by FK
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_geo_blocking_settings {
        uuid id PK
        text mode
        text default_action
        uuid updated_by FK
        timestamp_with_time_zone updated_at
    }
    public_idempotency_keys {
        uuid id PK
        text idempotency_key
        text provider
        timestamp_with_time_zone processed_at
    }
    public_index_proposals {
        uuid id PK
        bigint queryid
        text target_table
        text__ target_columns
        text ddl
        text rationale
        text confidence
        text status
        uuid proposed_by FK
        uuid applied_by FK
        timestamp_with_time_zone applied_at
        text error_message
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
        double_precision baseline_mean_ms
        double_precision post_apply_mean_ms
        numeric improvement_pct
        timestamp_with_time_zone measured_at
        timestamp_with_time_zone reverted_at
        text revert_reason
    }
    public_ip_access_rules {
        uuid id PK
        text ip_pattern
        text rule_type
        text description
        boolean is_active
        timestamp_with_time_zone created_at
        uuid created_by
        timestamp_with_time_zone updated_at
    }
    public_kanban_history {
        uuid id PK
        uuid delivery_id FK
        text from_status
        text to_status
        uuid action_by FK
        text notes
        timestamp_with_time_zone created_at
    }
    public_known_devices {
        uuid id PK
        uuid user_id
        text device_fingerprint
        text ip_address
        text browser
        text os
        text device_type
        text location
        timestamp_with_time_zone first_seen_at
        timestamp_with_time_zone last_seen_at
        boolean is_trusted
        text name
    }
    public_login_attempts {
        uuid id PK
        text email
        text ip_address
        text user_agent
        boolean success
        text failure_reason
        timestamp_with_time_zone created_at
    }
    public_logistica_reversa {
        uuid id PK
        uuid entrega_id FK
        uuid cliente_id FK
        text motivo
        text descricao_detalhada
        text status
        text prioridade
        text codigo_rastreio_reverso
        numeric_10_2_ valor_estorno
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
        uuid created_by FK
        integer version
    }
    public_mitigation_actions {
        uuid id PK
        uuid user_id FK
        text category
        text headline
        text priority
        text focus_carrier
        integer impact_score
        jsonb actions
        text status
        numeric_5_2_ otif_before
        numeric_5_2_ otif_after
        numeric_6_2_ otif_delta
        text notes
        timestamp_with_time_zone executed_at
        timestamp_with_time_zone measured_at
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_nexus_tactical_logs {
        uuid id PK
        text vehicle_id
        timestamp_with_time_zone event_time
        text message
        text type
        jsonb metadata
        timestamp_with_time_zone created_at
        text target_vehicle
        boolean protocol_executed
        jsonb alert_metadata
    }
    public_notificacoes_custo {
        uuid id PK
        uuid alerta_id FK
        text tipo_notificacao
        text mensagem
        numeric valor_atual
        numeric limite
        numeric percentual_atingido
        boolean lida
        timestamp_with_time_zone created_at
    }
    public_notifications {
        uuid id PK
        uuid user_id FK
        text title
        text message
        notification_type type
        boolean read
        text action_url
        jsonb metadata
        timestamp_with_time_zone created_at
        timestamp_with_time_zone read_at
    }
    public_ocorrencias {
        uuid id PK
        uuid entrega_id FK
        uuid coleta_id FK
        text tipo_ocorrencia
        text descricao
        text__ fotos_urls
        text acao_tomada
        boolean resolvida
        timestamp_with_time_zone data_resolucao
        timestamp_with_time_zone created_at
    }
    public_organizations {
        uuid id PK
        text name
        text slug
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_password_reset_requests {
        uuid id PK
        text email
        uuid user_id FK
        text status
        timestamp_with_time_zone requested_at
        timestamp_with_time_zone reviewed_at
        uuid reviewed_by
        text rejection_reason
        timestamp_with_time_zone created_at
    }
    public_performance_metrics {
        uuid id PK
        uuid entity_id
        text entity_type
        date period_start
        date period_end
        integer total_freights
        integer on_time_deliveries
        integer late_deliveries
        numeric_5_2_ sla_compliance_rate
        numeric_10_2_ average_lead_time_hours
        numeric_5_2_ efficiency_score
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_permissions {
        uuid id PK
        text code
        text name
        text description
        text module
        timestamp_with_time_zone created_at
    }
    public_prediction_accuracy_settings {
        uuid id PK
        uuid user_id FK
        text transportadora
        numeric target_pct
        integer consecutive_days_alert
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
        boolean notify_email
        boolean notify_whatsapp
        text email
        text whatsapp_phone
    }
    public_profiles {
        uuid id PK
        text email
        text full_name
        text avatar_url
        text cargo
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
        uuid organization_id FK
    }
    public_push_subscriptions {
        uuid id PK
        uuid user_id FK
        text endpoint
        text p256dh
        text auth
        text device_name
        text device_type
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_query_telemetry {
        uuid id PK
        text operation
        text table_name
        text rpc_name
        integer duration_ms
        integer record_count
        integer query_limit
        integer query_offset
        text count_mode
        text severity
        text error_message
        uuid user_id
        timestamp_with_time_zone created_at
    }
    public_rastreamento_alertas {
        uuid id PK
        text lalamove_order_id
        uuid coleta_id FK
        text alert_type
        text severity
        text message
        numeric latitude
        numeric longitude
        boolean resolved
        timestamp_with_time_zone resolved_at
        timestamp_with_time_zone created_at
    }
    public_rastreamento_historico {
        uuid id PK
        uuid coleta_id FK
        text lalamove_order_id
        text driver_id
        text driver_name
        text driver_phone
        text driver_plate
        numeric latitude
        numeric longitude
        text order_status
        timestamp_with_time_zone recorded_at PK
        timestamp_with_time_zone created_at
    }
    public_rate_limit_logs {
        uuid id PK
        text ip_address
        text endpoint
        uuid user_id FK
        integer request_count
        boolean blocked
        timestamp_with_time_zone created_at
        timestamp_with_time_zone window_start
    }
    public_remediation_actions {
        uuid id PK
        text suggestion_id
        text category
        text severity
        text title
        text detail
        text recommended_action
        jsonb evidence
        text status
        text admin_notes
        uuid applied_by FK
        timestamp_with_time_zone applied_at
        timestamp_with_time_zone resolved_at
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_reward_items {
        uuid id PK
        text name
        text description
        integer coins_cost
        text category
        text icon
        text rarity
        boolean available
        integer stock
        timestamp_with_time_zone created_at
    }
    public_reward_purchases {
        uuid id PK
        uuid user_id
        uuid reward_item_id FK
        integer coins_spent
        text status
        timestamp_with_time_zone redeemed_at
        timestamp_with_time_zone created_at
    }
    public_risk_zones {
        uuid id PK
        double_precision center_lat
        double_precision center_lng
        double_precision radius
        text severity
        text cause
        text suggested_action
        timestamp_with_time_zone created_at
        timestamp_with_time_zone expires_at
    }
    public_role_permissions {
        uuid id PK
        app_role role
        uuid permission_id FK
        timestamp_with_time_zone created_at
    }
    public_rte_gateway_health {
        uuid id PK
        text gateway
        boolean online
        integer http_status
        integer latency_ms
        text error_message
        timestamp_with_time_zone checked_at
        timestamp_with_time_zone created_at
    }
    public_rte_slo_daily_snapshots {
        uuid id PK
        date day
        text gateway
        integer checks
        integer failures
        numeric_6_2_ uptime_pct
        integer avg_latency_ms
        integer p95_latency_ms
        numeric_7_2_ error_budget_used_pct
        text status
        numeric_6_2_ uptime_target_pct
        integer latency_p95_budget_ms
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_rte_slo_targets {
        uuid id PK
        text gateway
        numeric_5_2_ uptime_target_pct
        integer latency_p95_budget_ms
        uuid updated_by
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_rule_execution_logs {
        uuid id PK
        uuid rule_id FK
        text entity_type
        uuid entity_id
        text trigger_event
        boolean conditions_met
        jsonb actions_executed
        integer execution_time_ms
        text error_message
        timestamp_with_time_zone created_at
    }
    public_scheduled_reports {
        uuid id PK
        uuid user_id FK
        text name
        text report_type
        text frequency
        time_without_time_zone time_of_day
        integer day_of_week
        integer day_of_month
        text__ recipients
        jsonb filters
        boolean is_active
        timestamp_with_time_zone last_sent_at
        timestamp_with_time_zone next_send_at
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_security_events {
        uuid id PK
        uuid user_id FK
        text event_type
        text severity
        text description
        text ip_address
        text user_agent
        jsonb metadata
        timestamp_with_time_zone created_at
    }
    public_sla_alerts {
        uuid id PK
        uuid freight_id
        text alert_type
        text severity
        text message
        timestamp_with_time_zone resolved_at
        timestamp_with_time_zone created_at
    }
    public_system_heartbeat {
        text service_name PK
        text status
        integer latency_ms
        timestamp_with_time_zone last_check
        text version
        jsonb metadata
    }
    public_system_integrity_logs {
        uuid id PK
        text action_type
        text description
        text entity_affected
        text severity
        boolean success
        text error_message
        jsonb metadata
        timestamp_with_time_zone created_at
    }
    public_tabelas_frete {
        uuid id PK
        uuid transportadora_id FK
        text regiao_destino
        text estado_destino
        numeric peso_min_kg
        numeric peso_max_kg
        numeric preco_por_kg
        numeric taxa_fixa
        integer prazo_dias
        boolean ativo
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_telemetry_logs {
        uuid id PK
        timestamp_with_time_zone created_at
        text severity
        text category
        text message
        text stack_trace
        jsonb metadata
        uuid user_id FK
        jsonb device_info
        text url
    }
    public_transportadora_rotas {
        uuid id PK
        uuid transportadora_id FK
        text origem_estado
        text origem_cidade
        text origem_cep_inicio
        text origem_cep_fim
        text destino_estado
        text destino_cidade
        text destino_cep_inicio
        text destino_cep_fim
        integer prazo_dias
        numeric preco_por_kg
        numeric taxa_fixa
        boolean ativo
        text observacoes
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_transportadoras {
        uuid id PK
        text razao_social
        text cnpj
        text nome_fantasia
        text contato_comercial
        text email_comercial
        text whatsapp_operacional
        text__ regioes_atendidas
        integer prazo_medio_dias
        boolean api_disponivel
        text url_rastreamento
        boolean homologada
        timestamp_with_time_zone data_homologacao
        integer score_performance
        text observacoes
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
        timestamp_with_time_zone deleted_at
        integer version
        jsonb credentials
        jsonb coverage_details
        jsonb non_api_config
    }
    public_user_achievements {
        uuid id PK
        uuid user_id FK
        uuid achievement_id FK
        timestamp_with_time_zone unlocked_at
    }
    public_user_levels {
        uuid id PK
        uuid user_id FK
        integer current_xp
        integer total_xp
        integer level
        integer coins
        integer streak_days
        date last_activity_date
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
        uuid rank_id FK
        numeric_5_2_ nexus_score
    }
    public_user_notification_preferences {
        uuid id PK
        uuid user_id
        boolean notifications_email
        boolean notifications_push
        boolean notifications_sla
        boolean notifications_ocorrencias
        boolean notifications_coletas
        boolean notifications_entregas
        boolean notifications_custos
        boolean notifications_achievements
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
        boolean notifications_whatsapp
    }
    public_user_onboarding {
        uuid id PK
        uuid user_id
        text__ completed_steps
        integer current_step
        timestamp_with_time_zone completed_at
        integer xp_earned
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_user_panel_preferences {
        uuid id PK
        uuid user_id FK
        numeric sla_critico_horas
        numeric sla_alto_horas
        numeric sla_medio_horas
        numeric sla_meta_on_time_pct
        timestamp_with_time_zone created_at
        timestamp_with_time_zone updated_at
    }
    public_user_ranks {
        uuid id PK
        text name
        integer min_level
        text icon
        text color
        numeric reward_multiplier
        timestamp_with_time_zone created_at
    }
    public_user_roles {
        uuid id PK
        uuid user_id FK
        app_role role
        timestamp_with_time_zone created_at
    }
    public_user_sessions {
        uuid id PK
        uuid user_id FK
        text device_name
        text device_type
        text browser
        text os
        text ip_address
        text location
        boolean is_current
        timestamp_with_time_zone last_active_at
        timestamp_with_time_zone created_at
        timestamp_with_time_zone expires_at
    }
    public_webauthn_challenges {
        uuid id PK
        uuid user_id FK
        text challenge
        text type
        timestamp_with_time_zone expires_at
        timestamp_with_time_zone created_at
    }
    public_webauthn_credentials {
        uuid id PK
        uuid user_id FK
        text credential_id
        text public_key
        integer counter
        text device_type
        text__ transports
        text friendly_name
        timestamp_with_time_zone created_at
        timestamp_with_time_zone last_used_at
    }
    public_webhook_deliveries {
        uuid id PK
        uuid webhook_id FK
        text event_type
        jsonb payload
        integer response_status
        boolean success
        text error_message
        timestamp_with_time_zone created_at
    }
    public_webhook_events_processed {
        uuid id PK
        text event_id
        text provider
        timestamp_with_time_zone processed_at
        jsonb payload
    }
    public_webhook_inbound_failures {
        uuid id PK
        text receiver
        text provider
        text event_id
        integer response_status
        text error_message
        timestamp_with_time_zone created_at
    }
    auth_users ||--o{ public_alertas_custo : "alertas_custo_created_by_fkey"
    public_transportadoras ||--o{ public_alertas_custo : "alertas_custo_transportadora_id_fkey"
    public_bitrix_sync_config ||--o{ public_bitrix_sync_logs : "bitrix_sync_logs_config_id_fkey"
    auth_users ||--o{ public_business_rules : "business_rules_created_by_fkey"
    auth_users ||--o{ public_business_rules_config : "business_rules_config_updated_by_fkey"
    public_transportadoras ||--o{ public_carrier_rankings : "carrier_rankings_transportadora_id_fkey"
    public_fornecedores ||--o{ public_coletas : "fk_coletas_fornecedor"
    public_transportadoras ||--o{ public_coletas : "fk_coletas_transportadora"
    auth_users ||--o{ public_comments : "comments_user_id_fkey"
    public_conciliacoes ||--o{ public_conciliacao_itens_importados : "conciliacao_itens_importados_conciliacao_id_fkey"
    auth_users ||--o{ public_conciliacao_itens_importados : "conciliacao_itens_importados_conciliado_por_fkey"
    auth_users ||--o{ public_conciliacoes : "conciliacoes_created_by_fkey"
    public_entregas ||--o{ public_cotacoes_frete : "cotacoes_frete_entrega_id_fkey"
    public_transportadoras ||--o{ public_cotacoes_frete : "cotacoes_frete_transportadora_id_fkey"
    public_transportadoras ||--o{ public_cotacoes_multicanal : "cotacoes_multicanal_transportadora_id_fkey"
    public_entregas ||--o{ public_delivery_receipt_audit : "delivery_receipt_audit_delivery_id_fkey"
    auth_users ||--o{ public_delivery_receipt_audit : "delivery_receipt_audit_user_id_fkey"
    public_clientes ||--o{ public_entregas : "entregas_cliente_id_fkey"
    public_transportadoras ||--o{ public_entregas : "entregas_transportadora_id_fkey"
    auth_users ||--o{ public_error_events : "error_events_user_id_fkey"
    public_transportadoras ||--o{ public_freight_decisions : "freight_decisions_selected_carrier_id_fkey"
    auth_users ||--o{ public_freight_decisions : "freight_decisions_user_id_fkey"
    public_transportadoras ||--o{ public_freight_integration_mappings : "freight_integration_mappings_transportadora_id_fkey"
    public_transportadoras ||--o{ public_freight_webhooks : "freight_webhooks_transportadora_id_fkey"
    public_organizations ||--o{ public_fretes_internos : "fretes_internos_organization_id_fkey"
    auth_users ||--o{ public_geo_access_rules : "geo_access_rules_created_by_fkey"
    auth_users ||--o{ public_geo_blocking_rules : "geo_blocking_rules_created_by_fkey"
    auth_users ||--o{ public_geo_blocking_settings : "geo_blocking_settings_updated_by_fkey"
    auth_users ||--o{ public_index_proposals : "index_proposals_applied_by_fkey"
    auth_users ||--o{ public_index_proposals : "index_proposals_proposed_by_fkey"
    auth_users ||--o{ public_kanban_history : "kanban_history_action_by_fkey"
    public_entregas ||--o{ public_kanban_history : "kanban_history_delivery_id_fkey"
    public_clientes ||--o{ public_logistica_reversa : "logistica_reversa_cliente_id_fkey"
    auth_users ||--o{ public_logistica_reversa : "logistica_reversa_created_by_fkey"
    public_entregas ||--o{ public_logistica_reversa : "logistica_reversa_entrega_id_fkey"
    auth_users ||--o{ public_mitigation_actions : "mitigation_actions_user_id_fkey"
    public_alertas_custo ||--o{ public_notificacoes_custo : "notificacoes_custo_alerta_id_fkey"
    auth_users ||--o{ public_notifications : "notifications_user_id_fkey"
    public_coletas ||--o{ public_ocorrencias : "ocorrencias_coleta_id_fkey"
    public_entregas ||--o{ public_ocorrencias : "ocorrencias_entrega_id_fkey"
    auth_users ||--o{ public_password_reset_requests : "password_reset_requests_user_id_fkey"
    auth_users ||--o{ public_prediction_accuracy_settings : "prediction_accuracy_settings_user_id_fkey"
    auth_users ||--o{ public_profiles : "profiles_id_fkey"
    public_organizations ||--o{ public_profiles : "profiles_organization_id_fkey"
    auth_users ||--o{ public_push_subscriptions : "push_subscriptions_user_id_fkey"
    public_coletas ||--o{ public_rastreamento_alertas : "rastreamento_alertas_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico : "rastreamento_historico_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico_y2026m01 : "rastreamento_historico_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico_y2026m02 : "rastreamento_historico_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico_y2026m03 : "rastreamento_historico_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico_y2026m04 : "rastreamento_historico_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico_y2026m05 : "rastreamento_historico_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico_y2026m06 : "rastreamento_historico_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico_y2026m07 : "rastreamento_historico_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico_y2026m08 : "rastreamento_historico_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico_y2026m09 : "rastreamento_historico_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico_y2026m10 : "rastreamento_historico_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico_y2026m11 : "rastreamento_historico_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico_y2026m12 : "rastreamento_historico_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico_y2027m01 : "rastreamento_historico_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico_y2027m02 : "rastreamento_historico_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico_y2027m03 : "rastreamento_historico_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico_y2027m04 : "rastreamento_historico_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico_y2027m05 : "rastreamento_historico_coleta_id_fkey"
    public_coletas ||--o{ public_rastreamento_historico_y2027m06 : "rastreamento_historico_coleta_id_fkey"
    auth_users ||--o{ public_rate_limit_logs : "rate_limit_logs_user_id_fkey"
    auth_users ||--o{ public_remediation_actions : "remediation_actions_applied_by_fkey"
    public_reward_items ||--o{ public_reward_purchases : "reward_purchases_reward_item_id_fkey"
    public_permissions ||--o{ public_role_permissions : "role_permissions_permission_id_fkey"
    public_business_rules ||--o{ public_rule_execution_logs : "rule_execution_logs_rule_id_fkey"
    auth_users ||--o{ public_scheduled_reports : "scheduled_reports_user_id_fkey"
    auth_users ||--o{ public_security_events : "security_events_user_id_fkey"
    public_transportadoras ||--o{ public_tabelas_frete : "tabelas_frete_transportadora_id_fkey"
    auth_users ||--o{ public_telemetry_logs : "telemetry_logs_user_id_fkey"
    public_transportadoras ||--o{ public_transportadora_rotas : "transportadora_rotas_transportadora_id_fkey"
    public_achievements ||--o{ public_user_achievements : "user_achievements_achievement_id_fkey"
    auth_users ||--o{ public_user_achievements : "user_achievements_user_id_fkey"
    public_user_ranks ||--o{ public_user_levels : "user_levels_rank_id_fkey"
    auth_users ||--o{ public_user_levels : "user_levels_user_id_fkey"
    auth_users ||--o{ public_user_panel_preferences : "user_panel_preferences_user_id_fkey"
    auth_users ||--o{ public_user_roles : "user_roles_user_id_fkey"
    auth_users ||--o{ public_user_sessions : "user_sessions_user_id_fkey"
    auth_users ||--o{ public_webauthn_challenges : "webauthn_challenges_user_id_fkey"
    auth_users ||--o{ public_webauthn_credentials : "webauthn_credentials_user_id_fkey"
    public_client_webhooks ||--o{ public_webhook_deliveries : "webhook_deliveries_webhook_id_fkey"
```

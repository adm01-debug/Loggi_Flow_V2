# Dicionário de dados — Loggi Flow V2 (gerado do catálogo em 2026-08-31)

Schemas public + internal · colunas: tipo · NN = NOT NULL · default · FK · comentário. Fonte: catálogo PostgreSQL 17 (origem = destino após paridade).

## internal.query_baseline

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | bigint | ✓ | nextval('internal.query_baseline_id_seq'::regclass) |  |  |
| captured_at | timestamp with time zone | ✓ | now() |  |  |
| queryid | bigint | ✓ |  |  |  |
| query_text | text | ✓ |  |  |  |
| calls | bigint | ✓ |  |  |  |
| total_exec_time | double precision | ✓ |  |  |  |
| mean_exec_time | double precision | ✓ |  |  |  |
| rows_processed | bigint | ✓ |  |  |  |
## public.account_lockouts

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| email | text | ✓ |  |  |  |
| locked_until | timestamp with time zone | ✓ |  |  |  |
| failed_attempts | integer | ✓ | 0 |  |  |
| reason | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.achievements

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| code | text | ✓ |  |  |  |
| name | text | ✓ |  |  |  |
| description | text | ✓ |  |  |  |
| icon | text | ✓ | 'Trophy'::text |  |  |
| category | text | ✓ | 'general'::text |  |  |
| rarity | text | ✓ | 'common'::text |  |  |
| xp_reward | integer | ✓ | 50 |  |  |
| coins_reward | integer | ✓ | 10 |  |  |
| requirement_type | text | ✓ |  |  |  |
| requirement_value | integer | ✓ | 1 |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.ai_chat_messages

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid | ✓ |  |  |  |
| role | text | ✓ |  |  |  |
| content | text | ✓ |  |  |  |
| metadata | jsonb |  | '{}'::jsonb |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.ai_delay_predictions

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| entity_id | uuid | ✓ |  |  |  |
| entity_type | text | ✓ |  |  |  |
| prediction_data | jsonb | ✓ |  |  |  |
| risco | text | ✓ |  |  |  |
| probabilidade_atraso | integer | ✓ |  |  |  |
| analyzed_at | timestamp with time zone |  | now() |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
## public.alertas_custo

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| tipo | text | ✓ |  |  |  |
| transportadora_id | uuid |  |  | transportadoras |  |
| estado_destino | text |  |  |  |  |
| limite_mensal | numeric | ✓ |  |  |  |
| limite_por_entrega | numeric |  |  |  |  |
| ativo | boolean | ✓ | true |  |  |
| notificar_percentual | integer | ✓ | 80 |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
| created_by | uuid |  |  | auth.users |  |
## public.allowed_ips

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid |  |  | auth.users |  |
| ip_address | text | ✓ |  |  |  |
| description | text |  |  |  |  |
| is_active | boolean | ✓ | true |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| created_by | uuid |  |  |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.architecture_decisions

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| title | text | ✓ |  |  |  |
| status | text | ✓ | 'accepted'::text |  |  |
| context | text |  |  |  |  |
| decision | text |  |  |  |  |
| consequences | text |  |  |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
| updated_at | timestamp with time zone |  | now() |  |  |
## public.audit_logs

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| table_name | text | ✓ |  |  |  |
| record_id | text | ✓ |  |  |  |
| action | text | ✓ |  |  |  |
| old_data | jsonb |  |  |  |  |
| new_data | jsonb |  |  |  |  |
| changed_fields | text[] |  |  |  |  |
| user_id | uuid |  |  |  |  |
| user_email | text |  |  |  |  |
| user_name | text |  |  |  |  |
| ip_address | text |  |  |  |  |
| user_agent | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.automation_audit_logs

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| rule_id | uuid |  |  |  |  |
| entity_id | uuid |  |  |  |  |
| entity_type | text |  |  |  |  |
| action_taken | text |  |  |  |  |
| payload | jsonb |  |  |  |  |
| status | text |  |  |  |  |
| error_message | text |  |  |  |  |
| execution_time_ms | integer |  |  |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
## public.bio_sync_alert_rules

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| vehicle_id | text |  |  |  |  |
| bpm_warning_threshold | integer |  | 95 |  |  |
| bpm_critical_threshold | integer |  | 110 |  |  |
| fatigue_warning_threshold | text |  | 'MED'::text |  |  |
| cooldown_minutes | integer |  | 5 |  |  |
| is_active | boolean |  | true |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
| updated_at | timestamp with time zone |  | now() |  |  |
## public.bio_sync_telemetry

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| driver_id | text | ✓ |  |  |  |
| vehicle_id | text | ✓ |  |  |  |
| heart_rate | integer | ✓ |  |  |  |
| fatigue_index | text | ✓ |  |  |  |
| timestamp | timestamp with time zone | ✓ | now() |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| severity | text |  | 'info'::text |  |  |
| cause | text |  |  |  |  |
| suggested_action | text |  |  |  |  |
## public.bitrix_sync_config

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| webhook_url | text |  |  |  |  |
| client_id | text |  |  |  |  |
| client_secret | text |  |  |  |  |
| access_token | text |  |  |  |  |
| refresh_token | text |  |  |  |  |
| last_sync_at | timestamp with time zone |  |  |  |  |
| is_active | boolean |  | true |  |  |
| sync_interval_minutes | integer |  | 60 |  |  |
| field_mapping | jsonb |  | '{}'::jsonb |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
| updated_at | timestamp with time zone |  | now() |  |  |
## public.bitrix_sync_logs

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| config_id | uuid |  |  | bitrix_sync_config |  |
| status | text | ✓ |  |  |  |
| synced_items_count | integer |  | 0 |  |  |
| error_message | text |  |  |  |  |
| details | jsonb |  |  |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
## public.business_rules

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| name | text | ✓ |  |  |  |
| description | text |  |  |  |  |
| entity_type | text | ✓ |  |  |  |
| trigger_event | text | ✓ |  |  |  |
| conditions | jsonb | ✓ | '[]'::jsonb |  |  |
| actions | jsonb | ✓ | '[]'::jsonb |  |  |
| is_active | boolean | ✓ | true |  |  |
| priority | integer | ✓ | 0 |  |  |
| created_by | uuid |  |  | auth.users |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.business_rules_config

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| key | text | ✓ |  |  |  |
| value | jsonb | ✓ |  |  |  |
| description | text |  |  |  |  |
| updated_by | uuid |  |  | auth.users |  |
| updated_at | timestamp with time zone | ✓ | timezone('utc'::text, now()) |  |  |
## public.carrier_rankings

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| transportadora_id | uuid | ✓ |  | transportadoras |  |
| period | text | ✓ |  |  |  |
| total_shipments | integer |  | 0 |  |  |
| on_time_shipments | integer |  | 0 |  |  |
| sla_percentage | numeric(5,2) |  | 0.00 |  |  |
| efficiency_score | numeric(5,2) |  | 0.00 |  |  |
| rank_tier | text |  | 'bronze'::text |  |  |
| last_updated | timestamp with time zone |  | now() |  |  |
## public.client_webhooks

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| url | text | ✓ |  |  |  |
| secret | text | ✓ | encode(gen_random_bytes(32), 'hex'::text) |  |  |
| events | text[] | ✓ | '{}'::text[] |  |  |
| active | boolean | ✓ | true |  |  |
| description | text |  |  |  |  |
| created_by | uuid |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.clientes

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| razao_social | text | ✓ |  |  |  |
| cnpj | text |  |  |  |  |
| nome_fantasia | text |  |  |  |  |
| endereco_completo | text | ✓ |  |  |  |
| cidade | text |  |  |  |  |
| estado | text |  |  |  |  |
| cep | text |  |  |  |  |
| contato_nome | text |  |  |  |  |
| contato_telefone | text |  |  |  |  |
| contato_email | text |  |  |  |  |
| restricoes_entrega | text |  |  |  |  |
| horario_entrega | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
| deleted_at | timestamp with time zone |  |  |  |  |
## public.coletas

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| numero_coleta | text | ✓ |  |  |  |
| fornecedor_id | uuid |  |  | fornecedores |  |
| endereco_coleta | text | ✓ |  |  |  |
| contato_coleta | text |  |  |  |  |
| tipo_coleta | coleta_tipo | ✓ | 'lalamove'::coleta_tipo |  |  |
| transportadora_id | uuid |  |  | transportadoras |  |
| data_prevista_coleta | timestamp with time zone |  |  |  |  |
| data_efetiva_coleta | timestamp with time zone |  |  |  |  |
| qtd_volumes | integer |  | 1 |  |  |
| peso_estimado_kg | numeric(10,2) |  |  |  |  |
| codigo_rastreamento | text |  |  |  |  |
| link_rastreamento | text |  |  |  |  |
| comprovante_coleta_url | text |  |  |  |  |
| status | coleta_status | ✓ | 'aguardando_liberacao'::coleta_status |  |  |
| observacoes | text |  |  |  |  |
| qtd_recebida | integer |  |  |  |  |
| divergencia_percentual | numeric(5,2) |  |  |  |  |
| nf_fornecedor | text |  |  |  |  |
| nf_anexo_url | text |  |  |  |  |
| responsavel_recebimento | text |  |  |  |  |
| data_recebimento | timestamp with time zone |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
| deleted_at | timestamp with time zone |  |  |  |  |
| version | integer |  | 0 |  |  |
| is_reverse | boolean |  | false |  |  |
| is_urgent | boolean |  | false |  |  |
| custo_estimado | numeric(10,2) |  | 0 |  |  |
| custo_real | numeric(10,2) |  | 0 |  |  |
## public.comments

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| content | text | ✓ |  |  |  |
| entity_type | text | ✓ |  |  |  |
| entity_id | uuid | ✓ |  |  |  |
| user_id | uuid | ✓ |  | auth.users |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.conciliacao_itens_importados

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| conciliacao_id | uuid | ✓ |  | conciliacoes |  |
| linha_arquivo | integer |  |  |  |  |
| referencia_externa | character varying(100) |  |  |  |  |
| descricao | text |  |  |  |  |
| data_documento | date |  |  |  |  |
| valor | numeric(12,2) | ✓ |  |  |  |
| transportadora_nome | character varying(255) |  |  |  |  |
| dados_originais | jsonb |  |  |  |  |
| status | character varying(30) | ✓ | 'pendente'::character varying |  |  |
| item_sistema_id | uuid |  |  |  |  |
| diferenca_valor | numeric(12,2) |  |  |  |  |
| observacoes | text |  |  |  |  |
| conciliado_em | timestamp with time zone |  |  |  |  |
| conciliado_por | uuid |  |  | auth.users |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.conciliacoes

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| tipo | character varying(50) | ✓ |  |  |  |
| nome | character varying(255) | ✓ |  |  |  |
| descricao | text |  |  |  |  |
| periodo_inicio | date |  |  |  |  |
| periodo_fim | date |  |  |  |  |
| status | character varying(30) | ✓ | 'rascunho'::character varying |  |  |
| total_itens_importados | integer | ✓ | 0 |  |  |
| total_itens_conciliados | integer | ✓ | 0 |  |  |
| total_divergencias | integer | ✓ | 0 |  |  |
| valor_total_importado | numeric(12,2) |  | 0 |  |  |
| valor_total_sistema | numeric(12,2) |  | 0 |  |  |
| diferenca_total | numeric(12,2) |  | 0 |  |  |
| created_by | uuid |  |  | auth.users |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.contract_test_logs

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| entity_name | text | ✓ |  |  |  |
| payload | jsonb |  |  |  |  |
| is_valid | boolean | ✓ |  |  |  |
| errors | jsonb |  |  |  |  |
| latency_ms | integer |  |  |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
## public.cotacoes_frete

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| entrega_id | uuid | ✓ |  | entregas |  |
| transportadora_id | uuid | ✓ |  | transportadoras |  |
| valor | numeric(10,2) | ✓ |  |  |  |
| prazo_dias | integer |  |  |  |  |
| selecionada | boolean |  | false |  |  |
| observacoes | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| version | integer |  | 1 |  |  |
## public.cotacoes_multicanal

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid | ✓ |  |  |  |
| transportadora_id | uuid | ✓ |  | transportadoras |  |
| canal | text | ✓ |  |  |  |
| status | text | ✓ | 'pendente'::text |  |  |
| origem_estado | text | ✓ |  |  |  |
| origem_cidade | text |  |  |  |  |
| destino_estado | text | ✓ |  |  |  |
| destino_cidade | text |  |  |  |  |
| peso_kg | numeric |  |  |  |  |
| volumes | integer |  | 1 |  |  |
| valor_mercadoria | numeric |  |  |  |  |
| valor_cotado | numeric |  |  |  |  |
| prazo_dias | integer |  |  |  |  |
| observacoes | text |  |  |  |  |
| expires_at | timestamp with time zone | ✓ | (now() + '24:00:00'::interval) |  |  |
| responded_at | timestamp with time zone |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
| version | integer |  | 0 |  |  |
| workflow_logs | jsonb |  | '[]'::jsonb |  |  |
| retry_count | integer |  | 0 |  |  |
| normalization_data | jsonb |  | '{}'::jsonb |  |  |
## public.db_health_score_history

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| captured_at | timestamp with time zone | ✓ | now() |  |  |
| overall_score | numeric | ✓ |  |  |  |
| grade | text | ✓ |  |  |  |
| slo_score | numeric | ✓ |  |  |  |
| anomaly_score | numeric | ✓ |  |  |  |
| mttr_score | numeric | ✓ |  |  |  |
| capacity_score | numeric | ✓ |  |  |  |
| details | jsonb | ✓ | '{}'::jsonb |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.db_health_snapshots

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| active_connections | integer |  |  |  |  |
| total_connections | integer |  |  |  |  |
| db_size_bytes | bigint |  |  |  |  |
| cache_hit_ratio | numeric |  |  |  |  |
| deadlocks | bigint |  |  |  |  |
| wal_size_bytes | bigint |  |  |  |  |
| metadata | jsonb | ✓ | '{}'::jsonb |  |  |
## public.db_slo_daily

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| day | date | ✓ |  |  |  |
| samples | integer | ✓ |  |  |  |
| connection_slo_pct | numeric | ✓ |  |  |  |
| cache_slo_pct | numeric | ✓ |  |  |  |
| deadlock_free_pct | numeric | ✓ |  |  |  |
| overall_slo_pct | numeric | ✓ |  |  |  |
| computed_at | timestamp with time zone | ✓ | now() |  |  |
## public.delay_predictions_history

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| entity_id | uuid | ✓ |  |  |  |
| entity_type | text | ✓ |  |  |  |
| entity_numero | text |  |  |  |  |
| risco | text | ✓ |  |  |  |
| probabilidade_atraso | integer | ✓ |  |  |  |
| horas_estimadas_atraso | numeric(6,2) | ✓ | 0 |  |  |
| motivos | jsonb | ✓ | '[]'::jsonb |  |  |
| recomendacoes | jsonb | ✓ | '[]'::jsonb |  |  |
| fatores | jsonb | ✓ | '[]'::jsonb |  |  |
| predicted_at | timestamp with time zone | ✓ | now() |  |  |
| confirmed_at | timestamp with time zone |  |  |  |  |
| was_accurate | boolean |  |  |  |  |
| actual_delay_hours | numeric(6,2) |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| transportadora | text |  |  |  |  |
## public.delivery_receipt_audit

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| delivery_id | uuid | ✓ |  | entregas |  |
| user_id | uuid |  |  | auth.users |  |
| file_name | text | ✓ |  |  |  |
| file_size | bigint |  |  |  |  |
| file_type | text |  |  |  |  |
| storage_path | text | ✓ |  |  |  |
| upload_status | text | ✓ |  |  |  |
| ocr_status | text |  |  |  |  |
| error_message | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.driver_badges

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| driver_id | uuid | ✓ |  | auth.users |  |
| badge_type | text | ✓ |  |  |  |
| level | integer |  | 1 |  |  |
| unlocked_at | timestamp with time zone |  | now() |  |  |
| metadata | jsonb |  | '{}'::jsonb |  |  |
## public.email_verification_tokens

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid | ✓ |  | auth.users |  |
| token | text | ✓ |  |  |  |
| expires_at | timestamp with time zone | ✓ |  |  |  |
| verified_at | timestamp with time zone |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.entregas

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| numero_entrega | text | ✓ |  |  |  |
| cliente_id | uuid |  |  | clientes |  |
| endereco_entrega | text | ✓ |  |  |  |
| contato_cliente | text |  |  |  |  |
| transportadora_id | uuid |  |  | transportadoras |  |
| valor_frete | numeric(10,2) |  |  |  |  |
| tipo_frete | frete_tipo |  | 'cif'::frete_tipo |  |  |
| nf_remessa | text |  |  |  |  |
| nf_remessa_url | text |  |  |  |  |
| box_alocado | text |  |  |  |  |
| data_despacho | timestamp with time zone |  |  |  |  |
| codigo_rastreamento | text |  |  |  |  |
| link_rastreamento | text |  |  |  |  |
| previsao_entrega | timestamp with time zone |  |  |  |  |
| data_entrega_efetiva | timestamp with time zone |  |  |  |  |
| recebedor | text |  |  |  |  |
| comprovante_entrega_url | text |  |  |  |  |
| status | entrega_status | ✓ | 'aguardando_producao'::entrega_status |  |  |
| observacoes | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
| latitude | numeric(10,8) |  |  |  |  |
| longitude | numeric(11,8) |  |  |  |  |
| geocoded_at | timestamp with time zone |  |  |  |  |
| deleted_at | timestamp with time zone |  |  |  |  |
| is_cross_docking | boolean |  | false |  |  |
| version | integer |  | 1 |  |  |
| tags | text[] |  | '{}'::text[] |  |  |
| ocr_data_extraida | jsonb |  | '{}'::jsonb |  |  |
| comprovante_audit_info | jsonb |  | '{}'::jsonb |  |  |
| weather_risk_score | integer |  | 0 |  |  |
| last_weather_update | timestamp with time zone |  |  |  |  |
## public.error_events

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid |  |  | auth.users |  |
| error_message | text | ✓ |  |  |  |
| stack_trace | text |  |  |  |  |
| context | jsonb |  |  |  |  |
| severity | text |  | 'error'::text |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
## public.feature_flags

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| key | text | ✓ |  |  |  |
| is_enabled | boolean | ✓ | false |  |  |
| description | text |  |  |  |  |
| metadata | jsonb |  | '{}'::jsonb |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.fornecedores

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| razao_social | text | ✓ |  |  |  |
| cnpj | text |  |  |  |  |
| nome_fantasia | text |  |  |  |  |
| endereco_completo | text | ✓ |  |  |  |
| cidade | text |  |  |  |  |
| estado | text |  |  |  |  |
| cep | text |  |  |  |  |
| contato_nome | text |  |  |  |  |
| contato_telefone | text |  |  |  |  |
| contato_email | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
| deleted_at | timestamp with time zone |  |  |  |  |
## public.freight_decisions

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid |  |  | auth.users |  |
| request_params | jsonb | ✓ |  |  |  |
| selected_carrier_id | uuid |  |  | transportadoras |  |
| selected_carrier_name | text |  |  |  |  |
| recommendations | jsonb | ✓ |  |  |  |
| rule_applied | jsonb |  |  |  |  |
| status | text |  | 'success'::text |  |  |
| error_message | text |  |  |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
## public.freight_integration_mappings

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| transportadora_id | uuid |  |  | transportadoras |  |
| source_type | text | ✓ |  |  |  |
| mapping_config | jsonb | ✓ |  |  |  |
| is_active | boolean |  | true |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
## public.freight_selection_rules

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| event_type | text | ✓ |  |  |  |
| max_sla_days | integer |  |  |  |  |
| price_weight | numeric |  | 0.5 |  |  |
| time_weight | numeric |  | 0.5 |  |  |
| is_active | boolean |  | true |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
| updated_at | timestamp with time zone |  | now() |  |  |
| performance_weight | numeric |  | 0.2 |  |  |
| is_default | boolean |  | false |  |  |
## public.freight_webhooks

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| transportadora_id | uuid |  |  | transportadoras |  |
| endpoint_url | text | ✓ |  |  |  |
| secret_key | text |  |  |  |  |
| event_type | text | ✓ |  |  |  |
| is_active | boolean |  | true |  |  |
| last_called_at | timestamp with time zone |  |  |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
| updated_at | timestamp with time zone |  | now() |  |  |
## public.fretes_internos

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| origem | text | ✓ |  |  |  |
| destino | text | ✓ |  |  |  |
| motorista | text |  |  |  |  |
| quantidade_itens | integer | ✓ | 1 |  |  |
| status | frete_interno_status | ✓ | 'pendente'::frete_interno_status |  |  |
| previsao_entrega | timestamp with time zone |  |  |  |  |
| data_entrega_efetiva | timestamp with time zone |  |  |  |  |
| xp_reward | integer | ✓ | 50 |  |  |
| observacoes | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
| organization_id | uuid |  |  | organizations |  |
## public.geo_access_rules

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| country_code | character varying(2) | ✓ |  |  |  |
| country_name | character varying(100) | ✓ |  |  |  |
| is_active | boolean | ✓ | true |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| created_by | uuid |  |  | auth.users |  |
## public.geo_blocked_attempts

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| ip_address | character varying(45) | ✓ |  |  |  |
| country_code | character varying(2) |  |  |  |  |
| country_name | character varying(100) |  |  |  |  |
| email | character varying(255) |  |  |  |  |
| user_agent | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.geo_blocking_rules

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| country_code | text | ✓ |  |  |  |
| country_name | text | ✓ |  |  |  |
| rule_type | text | ✓ |  |  |  |
| description | text |  |  |  |  |
| is_active | boolean | ✓ | true |  |  |
| created_by | uuid |  |  | auth.users |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.geo_blocking_settings

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| mode | text | ✓ | 'disabled'::text |  |  |
| default_action | text | ✓ | 'allow'::text |  |  |
| updated_by | uuid |  |  | auth.users |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.idempotency_keys

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| idempotency_key | text | ✓ |  |  |  |
| provider | text | ✓ |  |  |  |
| processed_at | timestamp with time zone |  | now() |  |  |
## public.index_proposals

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| queryid | bigint |  |  |  |  |
| target_table | text |  |  |  |  |
| target_columns | text[] |  |  |  |  |
| ddl | text | ✓ |  |  |  |
| rationale | text |  |  |  |  |
| confidence | text | ✓ | 'medium'::text |  |  |
| status | text | ✓ | 'proposed'::text |  |  |
| proposed_by | uuid |  |  | auth.users |  |
| applied_by | uuid |  |  | auth.users |  |
| applied_at | timestamp with time zone |  |  |  |  |
| error_message | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
| baseline_mean_ms | double precision |  |  |  |  |
| post_apply_mean_ms | double precision |  |  |  |  |
| improvement_pct | numeric |  |  |  |  |
| measured_at | timestamp with time zone |  |  |  |  |
| reverted_at | timestamp with time zone |  |  |  |  |
| revert_reason | text |  |  |  |  |
## public.ip_access_rules

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| ip_pattern | text | ✓ |  |  |  |
| rule_type | text | ✓ |  |  |  |
| description | text |  |  |  |  |
| is_active | boolean | ✓ | true |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| created_by | uuid |  |  |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.kanban_history

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| delivery_id | uuid | ✓ |  | entregas |  |
| from_status | text |  |  |  |  |
| to_status | text | ✓ |  |  |  |
| action_by | uuid |  |  | auth.users |  |
| notes | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.known_devices

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid | ✓ |  |  |  |
| device_fingerprint | text | ✓ |  |  |  |
| ip_address | text |  |  |  |  |
| browser | text |  |  |  |  |
| os | text |  |  |  |  |
| device_type | text |  |  |  |  |
| location | text |  |  |  |  |
| first_seen_at | timestamp with time zone | ✓ | now() |  |  |
| last_seen_at | timestamp with time zone | ✓ | now() |  |  |
| is_trusted | boolean |  | false |  |  |
| name | text |  |  |  |  |
## public.login_attempts

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| email | text | ✓ |  |  |  |
| ip_address | text |  |  |  |  |
| user_agent | text |  |  |  |  |
| success | boolean | ✓ | false |  |  |
| failure_reason | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.logistica_reversa

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| entrega_id | uuid |  |  | entregas |  |
| cliente_id | uuid |  |  | clientes |  |
| motivo | text | ✓ |  |  |  |
| descricao_detalhada | text |  |  |  |  |
| status | text | ✓ | 'pendente'::text |  |  |
| prioridade | text |  | 'normal'::text |  |  |
| codigo_rastreio_reverso | text |  |  |  |  |
| valor_estorno | numeric(10,2) |  |  |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
| updated_at | timestamp with time zone |  | now() |  |  |
| created_by | uuid |  |  | auth.users |  |
| version | integer |  | 0 |  |  |
## public.mitigation_actions

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid | ✓ |  | auth.users |  |
| category | text | ✓ |  |  |  |
| headline | text | ✓ |  |  |  |
| priority | text | ✓ |  |  |  |
| focus_carrier | text |  |  |  |  |
| impact_score | integer | ✓ | 0 |  |  |
| actions | jsonb | ✓ | '[]'::jsonb |  |  |
| status | text | ✓ | 'planejada'::text |  |  |
| otif_before | numeric(5,2) |  |  |  |  |
| otif_after | numeric(5,2) |  |  |  |  |
| otif_delta | numeric(6,2) |  | (COALESCE(otif_after, (0)::numeric) - COALESCE(otif_before, (0)::numeric)) |  |  |
| notes | text |  |  |  |  |
| executed_at | timestamp with time zone |  |  |  |  |
| measured_at | timestamp with time zone |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.nexus_tactical_logs

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| vehicle_id | text |  |  |  |  |
| event_time | timestamp with time zone | ✓ | now() |  |  |
| message | text | ✓ |  |  |  |
| type | text | ✓ |  |  |  |
| metadata | jsonb |  | '{}'::jsonb |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| target_vehicle | text |  |  |  |  |
| protocol_executed | boolean |  | false |  |  |
| alert_metadata | jsonb |  | '{}'::jsonb |  |  |
## public.notificacoes_custo

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| alerta_id | uuid |  |  | alertas_custo |  |
| tipo_notificacao | text | ✓ |  |  |  |
| mensagem | text | ✓ |  |  |  |
| valor_atual | numeric | ✓ |  |  |  |
| limite | numeric | ✓ |  |  |  |
| percentual_atingido | numeric | ✓ |  |  |  |
| lida | boolean | ✓ | false |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.notification_templates

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| code | text | ✓ |  |  |  |
| name | text | ✓ |  |  |  |
| subject | text |  |  |  |  |
| body_text | text | ✓ |  |  |  |
| body_html | text |  |  |  |  |
| channels | text[] |  | '{email,whatsapp}'::text[] |  |  |
| is_active | boolean |  | true |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
| updated_at | timestamp with time zone |  | now() |  |  |
## public.notifications

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid | ✓ |  |  |  |
| title | text | ✓ |  |  |  |
| message | text | ✓ |  |  |  |
| type | notification_type | ✓ | 'info'::notification_type |  |  |
| read | boolean | ✓ | false |  |  |
| action_url | text |  |  |  |  |
| metadata | jsonb |  | '{}'::jsonb |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| read_at | timestamp with time zone |  |  |  |  |
## public.ocorrencias

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| entrega_id | uuid |  |  | entregas |  |
| coleta_id | uuid |  |  | coletas |  |
| tipo_ocorrencia | text | ✓ |  |  |  |
| descricao | text |  |  |  |  |
| fotos_urls | text[] |  | '{}'::text[] |  |  |
| acao_tomada | text |  |  |  |  |
| resolvida | boolean |  | false |  |  |
| data_resolucao | timestamp with time zone |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.organizations

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| name | text | ✓ |  |  |  |
| slug | text | ✓ |  |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
| updated_at | timestamp with time zone |  | now() |  |  |
## public.password_reset_requests

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| email | text | ✓ |  |  |  |
| user_id | uuid |  |  | auth.users |  |
| status | text | ✓ | 'pending'::text |  |  |
| requested_at | timestamp with time zone | ✓ | now() |  |  |
| reviewed_at | timestamp with time zone |  |  |  |  |
| reviewed_by | uuid |  |  |  |  |
| rejection_reason | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.performance_metrics

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| entity_id | uuid | ✓ |  |  |  |
| entity_type | text | ✓ |  |  |  |
| period_start | date | ✓ |  |  |  |
| period_end | date | ✓ |  |  |  |
| total_freights | integer |  | 0 |  |  |
| on_time_deliveries | integer |  | 0 |  |  |
| late_deliveries | integer |  | 0 |  |  |
| sla_compliance_rate | numeric(5,2) |  |  |  |  |
| average_lead_time_hours | numeric(10,2) |  |  |  |  |
| efficiency_score | numeric(5,2) |  |  |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
| updated_at | timestamp with time zone |  | now() |  |  |
## public.permissions

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| code | text | ✓ |  |  |  |
| name | text | ✓ |  |  |  |
| description | text |  |  |  |  |
| module | text | ✓ |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.prediction_accuracy_settings

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid | ✓ |  | auth.users |  |
| transportadora | text |  |  |  |  |
| target_pct | numeric | ✓ | 80 |  |  |
| consecutive_days_alert | integer | ✓ | 3 |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
| notify_email | boolean | ✓ | false |  |  |
| notify_whatsapp | boolean | ✓ | false |  |  |
| email | text |  |  |  |  |
| whatsapp_phone | text |  |  |  |  |
## public.profiles

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ |  | auth.users |  |
| email | text |  |  |  |  |
| full_name | text |  |  |  |  |
| avatar_url | text |  |  |  |  |
| cargo | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
| organization_id | uuid |  |  | organizations |  |
## public.push_subscriptions

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid | ✓ |  | auth.users |  |
| endpoint | text | ✓ |  |  |  |
| p256dh | text | ✓ |  |  |  |
| auth | text | ✓ |  |  |  |
| device_name | text |  |  |  |  |
| device_type | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.query_telemetry

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| operation | text | ✓ |  |  |  |
| table_name | text |  |  |  |  |
| rpc_name | text |  |  |  |  |
| duration_ms | integer | ✓ | 0 |  |  |
| record_count | integer |  |  |  |  |
| query_limit | integer |  |  |  |  |
| query_offset | integer |  |  |  |  |
| count_mode | text |  |  |  |  |
| severity | text | ✓ | 'normal'::text |  |  |
| error_message | text |  |  |  |  |
| user_id | uuid |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.rastreamento_alertas

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| lalamove_order_id | text | ✓ |  |  |  |
| coleta_id | uuid |  |  | coletas |  |
| alert_type | text | ✓ |  |  |  |
| severity | text | ✓ |  |  |  |
| message | text | ✓ |  |  |  |
| latitude | numeric |  |  |  |  |
| longitude | numeric |  |  |  |  |
| resolved | boolean |  | false |  |  |
| resolved_at | timestamp with time zone |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.rastreamento_historico

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| coleta_id | uuid |  |  | coletas |  |
| lalamove_order_id | text | ✓ |  |  |  |
| driver_id | text |  |  |  |  |
| driver_name | text |  |  |  |  |
| driver_phone | text |  |  |  |  |
| driver_plate | text |  |  |  |  |
| latitude | numeric | ✓ |  |  |  |
| longitude | numeric | ✓ |  |  |  |
| order_status | text |  |  |  |  |
| recorded_at | timestamp with time zone | ✓ | now() |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.rate_limit_logs

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| ip_address | text | ✓ |  |  |  |
| endpoint | text | ✓ |  |  |  |
| user_id | uuid |  |  | auth.users |  |
| request_count | integer | ✓ | 1 |  |  |
| blocked | boolean | ✓ | false |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| window_start | timestamp with time zone | ✓ | now() |  |  |
## public.remediation_actions

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| suggestion_id | text | ✓ |  |  |  |
| category | text | ✓ |  |  |  |
| severity | text | ✓ |  |  |  |
| title | text | ✓ |  |  |  |
| detail | text |  |  |  |  |
| recommended_action | text | ✓ |  |  |  |
| evidence | jsonb | ✓ | '{}'::jsonb |  |  |
| status | text | ✓ | 'pending'::text |  |  |
| admin_notes | text |  |  |  |  |
| applied_by | uuid |  |  | auth.users |  |
| applied_at | timestamp with time zone |  |  |  |  |
| resolved_at | timestamp with time zone |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.reward_items

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| name | text | ✓ |  |  |  |
| description | text | ✓ |  |  |  |
| coins_cost | integer | ✓ | 100 |  |  |
| category | text | ✓ | 'geral'::text |  |  |
| icon | text | ✓ | 'Gift'::text |  |  |
| rarity | text | ✓ | 'common'::text |  |  |
| available | boolean | ✓ | true |  |  |
| stock | integer |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.reward_purchases

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid | ✓ |  |  |  |
| reward_item_id | uuid | ✓ |  | reward_items |  |
| coins_spent | integer | ✓ |  |  |  |
| status | text | ✓ | 'pending'::text |  |  |
| redeemed_at | timestamp with time zone |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.risk_zones

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| center_lat | double precision | ✓ |  |  |  |
| center_lng | double precision | ✓ |  |  |  |
| radius | double precision | ✓ |  |  |  |
| severity | text |  |  |  |  |
| cause | text |  |  |  |  |
| suggested_action | text |  |  |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
| expires_at | timestamp with time zone |  |  |  |  |
## public.role_permissions

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| role | app_role | ✓ |  |  |  |
| permission_id | uuid | ✓ |  | permissions |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.rte_gateway_health

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| gateway | text | ✓ |  |  |  |
| online | boolean | ✓ |  |  |  |
| http_status | integer | ✓ | 0 |  |  |
| latency_ms | integer | ✓ | 0 |  |  |
| error_message | text |  |  |  |  |
| checked_at | timestamp with time zone | ✓ | now() |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.rte_slo_daily_snapshots

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| day | date | ✓ |  |  |  |
| gateway | text | ✓ |  |  |  |
| checks | integer | ✓ | 0 |  |  |
| failures | integer | ✓ | 0 |  |  |
| uptime_pct | numeric(6,2) | ✓ | 0 |  |  |
| avg_latency_ms | integer | ✓ | 0 |  |  |
| p95_latency_ms | integer | ✓ | 0 |  |  |
| error_budget_used_pct | numeric(7,2) | ✓ | 0 |  |  |
| status | text | ✓ | 'ok'::text |  |  |
| uptime_target_pct | numeric(6,2) | ✓ | 99 |  |  |
| latency_p95_budget_ms | integer | ✓ | 3000 |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.rte_slo_targets

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| gateway | text | ✓ |  |  |  |
| uptime_target_pct | numeric(5,2) | ✓ | 99 |  |  |
| latency_p95_budget_ms | integer | ✓ | 2000 |  |  |
| updated_by | uuid |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.rule_execution_logs

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| rule_id | uuid |  |  | business_rules |  |
| entity_type | text | ✓ |  |  |  |
| entity_id | uuid | ✓ |  |  |  |
| trigger_event | text | ✓ |  |  |  |
| conditions_met | boolean | ✓ |  |  |  |
| actions_executed | jsonb |  |  |  |  |
| execution_time_ms | integer |  |  |  |  |
| error_message | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.scheduled_reports

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid | ✓ |  |  |  |
| name | text | ✓ |  |  |  |
| report_type | text | ✓ |  |  |  |
| frequency | text | ✓ | 'weekly'::text |  |  |
| day_of_week | integer |  |  |  |  |
| day_of_month | integer |  |  |  |  |
| time_of_day | time without time zone | ✓ | '08:00:00'::time without time zone |  |  |
| recipients | text[] | ✓ | '{}'::text[] |  |  |
| filters | jsonb |  | '{}'::jsonb |  |  |
| is_active | boolean | ✓ | true |  |  |
| last_sent_at | timestamp with time zone |  |  |  |  |
| next_send_at | timestamp with time zone |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.security_events

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid |  |  | auth.users |  |
| event_type | text | ✓ |  |  |  |
| severity | text | ✓ | 'info'::text |  |  |
| description | text | ✓ |  |  |  |
| ip_address | text |  |  |  |  |
| user_agent | text |  |  |  |  |
| metadata | jsonb |  | '{}'::jsonb |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.sla_alerts

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| freight_id | uuid | ✓ |  |  |  |
| alert_type | text | ✓ |  |  |  |
| severity | text |  | 'warning'::text |  |  |
| message | text |  |  |  |  |
| resolved_at | timestamp with time zone |  |  |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
## public.system_adr

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| title | text | ✓ |  |  |  |
| status | text | ✓ |  |  |  |
| context | text |  |  |  |  |
| decision | text |  |  |  |  |
| consequences | text |  |  |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
| updated_at | timestamp with time zone |  | now() |  |  |
## public.system_contract_schemas

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| entity_name | text | ✓ |  |  |  |
| schema | jsonb | ✓ |  |  |  |
| version | integer |  | 1 |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
| updated_at | timestamp with time zone |  | now() |  |  |
## public.system_heartbeat

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| service_name | text | ✓ |  |  |  |
| status | text | ✓ |  |  |  |
| latency_ms | integer |  |  |  |  |
| last_check | timestamp with time zone | ✓ | now() |  |  |
| version | text |  |  |  |  |
| metadata | jsonb |  | '{}'::jsonb |  |  |
## public.system_integrity_logs

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| action_type | text | ✓ |  |  |  |
| description | text | ✓ |  |  |  |
| entity_affected | text |  |  |  |  |
| severity | text | ✓ |  |  |  |
| success | boolean | ✓ | true |  |  |
| error_message | text |  |  |  |  |
| metadata | jsonb |  | '{}'::jsonb |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.tabelas_frete

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| transportadora_id | uuid | ✓ |  | transportadoras |  |
| regiao_destino | text | ✓ |  |  |  |
| estado_destino | text | ✓ |  |  |  |
| peso_min_kg | numeric | ✓ | 0 |  |  |
| peso_max_kg | numeric | ✓ | 999999 |  |  |
| preco_por_kg | numeric | ✓ |  |  |  |
| taxa_fixa | numeric | ✓ | 0 |  |  |
| prazo_dias | integer | ✓ | 5 |  |  |
| ativo | boolean | ✓ | true |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.telemetry_logs

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| severity | text | ✓ |  |  |  |
| category | text | ✓ |  |  |  |
| message | text | ✓ |  |  |  |
| stack_trace | text |  |  |  |  |
| metadata | jsonb |  | '{}'::jsonb |  |  |
| user_id | uuid |  |  | auth.users |  |
| device_info | jsonb |  | '{}'::jsonb |  |  |
| url | text |  |  |  |  |
## public.transportadora_rotas

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| transportadora_id | uuid | ✓ |  | transportadoras |  |
| origem_estado | text | ✓ |  |  |  |
| origem_cidade | text |  |  |  |  |
| origem_cep_inicio | text |  |  |  |  |
| origem_cep_fim | text |  |  |  |  |
| destino_estado | text | ✓ |  |  |  |
| destino_cidade | text |  |  |  |  |
| destino_cep_inicio | text |  |  |  |  |
| destino_cep_fim | text |  |  |  |  |
| prazo_dias | integer |  | 5 |  |  |
| preco_por_kg | numeric |  | 0 |  |  |
| taxa_fixa | numeric |  | 0 |  |  |
| ativo | boolean |  | true |  |  |
| observacoes | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.transportadoras

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| razao_social | text | ✓ |  |  |  |
| cnpj | text | ✓ |  |  |  |
| nome_fantasia | text | ✓ |  |  |  |
| contato_comercial | text | ✓ |  |  |  |
| email_comercial | text | ✓ |  |  |  |
| whatsapp_operacional | text |  |  |  |  |
| regioes_atendidas | text[] |  | '{}'::text[] |  |  |
| prazo_medio_dias | integer |  |  |  |  |
| api_disponivel | boolean |  | false |  |  |
| url_rastreamento | text |  |  |  |  |
| homologada | boolean |  | true |  |  |
| data_homologacao | timestamp with time zone |  | now() |  |  |
| score_performance | integer |  | 0 |  |  |
| observacoes | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
| deleted_at | timestamp with time zone |  |  |  |  |
| version | integer |  | 1 |  |  |
| credentials | jsonb |  | '{}'::jsonb |  |  |
| coverage_details | jsonb |  | '{}'::jsonb |  |  |
| non_api_config | jsonb |  | '{}'::jsonb |  |  |
## public.user_achievements

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid | ✓ |  | auth.users |  |
| achievement_id | uuid | ✓ |  | achievements |  |
| unlocked_at | timestamp with time zone | ✓ | now() |  |  |
## public.user_levels

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid | ✓ |  | auth.users |  |
| current_xp | integer | ✓ | 0 |  |  |
| total_xp | integer | ✓ | 0 |  |  |
| level | integer | ✓ | 1 |  |  |
| coins | integer | ✓ | 0 |  |  |
| streak_days | integer | ✓ | 0 |  |  |
| last_activity_date | date |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
| rank_id | uuid |  |  | user_ranks |  |
| nexus_score | numeric(5,2) |  | 0 |  | Core Nexus Score (0-100): logistics performance composite metric used by useGamification hook |
## public.user_notification_preferences

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid | ✓ |  |  |  |
| notifications_email | boolean | ✓ | true |  |  |
| notifications_push | boolean | ✓ | true |  |  |
| notifications_sla | boolean | ✓ | true |  |  |
| notifications_ocorrencias | boolean | ✓ | true |  |  |
| notifications_coletas | boolean | ✓ | true |  |  |
| notifications_entregas | boolean | ✓ | true |  |  |
| notifications_custos | boolean | ✓ | true |  |  |
| notifications_achievements | boolean | ✓ | true |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
| notifications_whatsapp | boolean |  | true |  |  |
## public.user_onboarding

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid | ✓ |  |  |  |
| completed_steps | text[] |  | '{}'::text[] |  |  |
| current_step | integer |  | 0 |  |  |
| completed_at | timestamp with time zone |  |  |  |  |
| xp_earned | integer |  | 0 |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| updated_at | timestamp with time zone | ✓ | now() |  |  |
## public.user_ranks

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| name | text | ✓ |  |  |  |
| min_level | integer | ✓ |  |  |  |
| icon | text | ✓ |  |  |  |
| color | text | ✓ |  |  |  |
| reward_multiplier | numeric |  | 1.0 |  |  |
| created_at | timestamp with time zone |  | now() |  |  |
## public.user_roles

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid | ✓ |  | auth.users |  |
| role | app_role | ✓ | 'user'::app_role |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.user_sessions

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid | ✓ |  | auth.users |  |
| device_name | text |  |  |  |  |
| device_type | text |  |  |  |  |
| browser | text |  |  |  |  |
| os | text |  |  |  |  |
| ip_address | text |  |  |  |  |
| location | text |  |  |  |  |
| is_current | boolean |  | false |  |  |
| last_active_at | timestamp with time zone | ✓ | now() |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| expires_at | timestamp with time zone |  |  |  |  |
## public.webauthn_challenges

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid |  |  | auth.users |  |
| challenge | text | ✓ |  |  |  |
| type | text | ✓ |  |  |  |
| expires_at | timestamp with time zone | ✓ | (now() + '00:05:00'::interval) |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.webauthn_credentials

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| user_id | uuid | ✓ |  | auth.users |  |
| credential_id | text | ✓ |  |  |  |
| public_key | text | ✓ |  |  |  |
| counter | integer | ✓ | 0 |  |  |
| device_type | text |  |  |  |  |
| transports | text[] |  |  |  |  |
| friendly_name | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
| last_used_at | timestamp with time zone |  |  |  |  |
## public.webhook_deliveries

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| webhook_id | uuid | ✓ |  | client_webhooks |  |
| event_type | text | ✓ |  |  |  |
| payload | jsonb |  |  |  |  |
| response_status | integer |  |  |  |  |
| success | boolean | ✓ | false |  |  |
| error_message | text |  |  |  |  |
| created_at | timestamp with time zone | ✓ | now() |  |  |
## public.webhook_events_processed

| coluna | tipo | NN | default | FK | comentário |
|---|---|---|---|---|---|
| id | uuid | ✓ | gen_random_uuid() |  |  |
| event_id | text | ✓ |  |  |  |
| provider | text | ✓ |  |  |  |
| processed_at | timestamp with time zone |  | now() |  |  |
| payload | jsonb |  |  |  |  |

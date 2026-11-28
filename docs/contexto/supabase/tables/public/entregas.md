# public.entregas

> Delivery orders to customers

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `numero_entrega` | `text` | não |  |  |  |
| 3 | `cliente_id` | `uuid` | sim |  |  |  |
| 4 | `endereco_entrega` | `text` | não |  |  |  |
| 5 | `contato_cliente` | `text` | sim |  |  |  |
| 6 | `transportadora_id` | `uuid` | sim |  |  |  |
| 7 | `valor_frete` | `numeric(10,2)` | sim |  |  |  |
| 8 | `tipo_frete` | `frete_tipo` | sim | `'cif'::frete_tipo` |  |  |
| 9 | `nf_remessa` | `text` | sim |  |  |  |
| 10 | `nf_remessa_url` | `text` | sim |  |  |  |
| 11 | `box_alocado` | `text` | sim |  |  |  |
| 12 | `data_despacho` | `timestamp with time zone` | sim |  |  |  |
| 13 | `codigo_rastreamento` | `text` | sim |  |  |  |
| 14 | `link_rastreamento` | `text` | sim |  |  |  |
| 15 | `previsao_entrega` | `timestamp with time zone` | sim |  |  |  |
| 16 | `data_entrega_efetiva` | `timestamp with time zone` | sim |  |  |  |
| 17 | `recebedor` | `text` | sim |  |  |  |
| 18 | `comprovante_entrega_url` | `text` | sim |  |  |  |
| 19 | `status` | `entrega_status` | não | `'aguardando_producao'::entrega_status` |  |  |
| 20 | `observacoes` | `text` | sim |  |  |  |
| 21 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 22 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 23 | `latitude` | `numeric(10,8)` | sim |  |  | Geocoded latitude from delivery address |
| 24 | `longitude` | `numeric(11,8)` | sim |  |  | Geocoded longitude from delivery address |
| 25 | `geocoded_at` | `timestamp with time zone` | sim |  |  | Timestamp when coordinates were geocoded |
| 26 | `deleted_at` | `timestamp with time zone` | sim |  |  |  |
| 27 | `is_cross_docking` | `boolean` | sim | `false` |  |  |
| 28 | `version` | `integer` | sim | `1` |  |  |
| 29 | `tags` | `text[]` | sim | `'{}'::text[]` |  |  |
| 30 | `ocr_data_extraida` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 31 | `comprovante_audit_info` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 32 | `weather_risk_score` | `integer` | sim | `0` |  |  |
| 33 | `last_weather_update` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| entregas_cliente_id_fkey | FOREIGN KEY | `FOREIGN KEY (cliente_id) REFERENCES clientes(id)` | NO ACTION | NO ACTION | sim |
| entregas_numero_entrega_key | UNIQUE | `UNIQUE (numero_entrega)` |  |  | sim |
| entregas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| entregas_transportadora_id_fkey | FOREIGN KEY | `FOREIGN KEY (transportadora_id) REFERENCES transportadoras(id)` | NO ACTION | NO ACTION | sim |
| entregas_valor_frete_nonneg | CHECK | `CHECK (valor_frete IS NULL OR valor_frete >= 0::numeric)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.cotacoes_frete | cotacoes_frete_entrega_id_fkey | entrega_id | NO ACTION |
| public.delivery_receipt_audit | delivery_receipt_audit_delivery_id_fkey | delivery_id | CASCADE |
| public.kanban_history | kanban_history_delivery_id_fkey | delivery_id | CASCADE |
| public.logistica_reversa | logistica_reversa_entrega_id_fkey | entrega_id | NO ACTION |
| public.ocorrencias | ocorrencias_entrega_id_fkey | entrega_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| entregas_numero_entrega_key | btree | numero_entrega | sim | sim |  | `CREATE UNIQUE INDEX entregas_numero_entrega_key ON public.entregas USING btree (numero_entrega)` |
| entregas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX entregas_pkey ON public.entregas USING btree (id)` |
| idx_entregas_active | btree | created_at | não | sim | `(deleted_at IS NULL)` | `CREATE INDEX idx_entregas_active ON public.entregas USING btree (created_at DESC) WHERE (deleted_at IS NULL)` |
| idx_entregas_cliente_id | btree | cliente_id | não | sim |  | `CREATE INDEX idx_entregas_cliente_id ON public.entregas USING btree (cliente_id)` |
| idx_entregas_codigo_rastreamento | btree | codigo_rastreamento | não | sim | `(codigo_rastreamento IS NOT NULL)` | `CREATE INDEX idx_entregas_codigo_rastreamento ON public.entregas USING btree (codigo_rastreamento) WHERE (codigo_rastreamento IS NOT NULL)` |
| idx_entregas_coordinates | btree | latitude, longitude | não | sim | `((latitude IS NOT NULL) AND (longitude IS NOT NULL))` | `CREATE INDEX idx_entregas_coordinates ON public.entregas USING btree (latitude, longitude) WHERE ((latitude IS NOT NULL) AND (longitude IS NOT NULL))` |
| idx_entregas_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_entregas_created_at ON public.entregas USING btree (created_at DESC)` |
| idx_entregas_deleted_at | btree | deleted_at | não | sim | `(deleted_at IS NULL)` | `CREATE INDEX idx_entregas_deleted_at ON public.entregas USING btree (deleted_at) WHERE (deleted_at IS NULL)` |
| idx_entregas_nf_remessa | btree | nf_remessa | não | sim | `(nf_remessa IS NOT NULL)` | `CREATE INDEX idx_entregas_nf_remessa ON public.entregas USING btree (nf_remessa) WHERE (nf_remessa IS NOT NULL)` |
| idx_entregas_previsao | btree | previsao_entrega | não | sim | `(data_entrega_efetiva IS NULL)` | `CREATE INDEX idx_entregas_previsao ON public.entregas USING btree (previsao_entrega) WHERE (data_entrega_efetiva IS NULL)` |
| idx_entregas_previsao_active | btree | previsao_entrega | não | sim | `((status <> ALL (ARRAY['entregue'::entrega_status, 'finalizado'::entrega_status])) AND (deleted_at IS NULL))` | `CREATE INDEX idx_entregas_previsao_active ON public.entregas USING btree (previsao_entrega) WHERE ((status <> ALL (ARRAY['entregue'::entrega_status, 'finalizado'::entrega_status])) AND (deleted_at IS NULL))` |
| idx_entregas_previsao_pendente | btree | previsao_entrega | não | sim | `((data_entrega_efetiva IS NULL) AND (deleted_at IS NULL))` | `CREATE INDEX idx_entregas_previsao_pendente ON public.entregas USING btree (previsao_entrega) WHERE ((data_entrega_efetiva IS NULL) AND (deleted_at IS NULL))` |
| idx_entregas_rastreamento | btree | codigo_rastreamento | não | sim | `((codigo_rastreamento IS NOT NULL) AND (deleted_at IS NULL))` | `CREATE INDEX idx_entregas_rastreamento ON public.entregas USING btree (codigo_rastreamento) WHERE ((codigo_rastreamento IS NOT NULL) AND (deleted_at IS NULL))` |
| idx_entregas_status | btree | status | não | sim |  | `CREATE INDEX idx_entregas_status ON public.entregas USING btree (status)` |
| idx_entregas_status_created_at | btree | status, created_at | não | sim |  | `CREATE INDEX idx_entregas_status_created_at ON public.entregas USING btree (status, created_at DESC)` |
| idx_entregas_transp_status | btree | transportadora_id, status | não | sim |  | `CREATE INDEX idx_entregas_transp_status ON public.entregas USING btree (transportadora_id, status)` |
| idx_entregas_transportadora_id | btree | transportadora_id | não | sim |  | `CREATE INDEX idx_entregas_transportadora_id ON public.entregas USING btree (transportadora_id)` |


## Policies (RLS)

### `Admins can delete entregas`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can update entregas`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Auth users can insert entregas`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() IS NOT NULL)` |

### `Authenticated users can view entregas`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| a_valida_transicao_entregas | BEFORE | UPDATE | ROW | enabled | public.fn_tr_valida_transicao_entrega |
| audit_log_trigger | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_log_trigger |
| generate_entrega_numero_trigger | BEFORE | INSERT | ROW | enabled | public.generate_entrega_numero |
| tr_entregas_optimistic_locking | BEFORE | UPDATE | ROW | enabled | public.handle_optimistic_locking |
| tr_increment_entregas_version | BEFORE | UPDATE | ROW | enabled | public.increment_version_column |
| trg_entregas_prediction_feedback | AFTER | UPDATE | ROW | enabled | public.mark_predictions_accurate |
| trigger_notify_entrega_atrasada | AFTER | UPDATE | ROW | enabled | public.notify_entrega_atrasada |
| trigger_notify_entrega_concluida | AFTER | UPDATE | ROW | enabled | public.notify_entrega_concluida |
| trigger_update_carrier_ranking | AFTER | UPDATE | ROW | enabled | public.update_carrier_ranking |
| update_entregas_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| validate_entregas_frete | BEFORE | INSERT OR UPDATE | ROW | enabled | public.validate_frete_values |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

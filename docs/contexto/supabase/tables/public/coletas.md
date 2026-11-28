# public.coletas

> Pickup orders from suppliers

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `numero_coleta` | `text` | não |  |  |  |
| 3 | `fornecedor_id` | `uuid` | sim |  |  |  |
| 4 | `endereco_coleta` | `text` | não |  |  |  |
| 5 | `contato_coleta` | `text` | sim |  |  |  |
| 6 | `tipo_coleta` | `coleta_tipo` | não | `'lalamove'::coleta_tipo` |  |  |
| 7 | `transportadora_id` | `uuid` | sim |  |  |  |
| 8 | `data_prevista_coleta` | `timestamp with time zone` | sim |  |  |  |
| 9 | `data_efetiva_coleta` | `timestamp with time zone` | sim |  |  |  |
| 10 | `qtd_volumes` | `integer` | sim | `1` |  |  |
| 11 | `peso_estimado_kg` | `numeric(10,2)` | sim |  |  |  |
| 12 | `codigo_rastreamento` | `text` | sim |  |  |  |
| 13 | `link_rastreamento` | `text` | sim |  |  |  |
| 14 | `comprovante_coleta_url` | `text` | sim |  |  |  |
| 15 | `status` | `coleta_status` | não | `'aguardando_liberacao'::coleta_status` |  |  |
| 16 | `observacoes` | `text` | sim |  |  |  |
| 17 | `qtd_recebida` | `integer` | sim |  |  |  |
| 18 | `divergencia_percentual` | `numeric(5,2)` | sim |  |  |  |
| 19 | `nf_fornecedor` | `text` | sim |  |  |  |
| 20 | `nf_anexo_url` | `text` | sim |  |  |  |
| 21 | `responsavel_recebimento` | `text` | sim |  |  |  |
| 22 | `data_recebimento` | `timestamp with time zone` | sim |  |  |  |
| 23 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 24 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 26 | `deleted_at` | `timestamp with time zone` | sim |  |  |  |
| 27 | `version` | `integer` | sim | `0` |  |  |
| 28 | `is_reverse` | `boolean` | sim | `false` |  |  |
| 29 | `is_urgent` | `boolean` | sim | `false` |  |  |
| 30 | `custo_estimado` | `numeric(10,2)` | sim | `0` |  |  |
| 31 | `custo_real` | `numeric(10,2)` | sim | `0` |  |  |
| 32 | `peso_efetivo` | `numeric` | sim |  |  | Peso aferido na conferencia de recebimento (kg). |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| coletas_numero_coleta_key | UNIQUE | `UNIQUE (numero_coleta)` |  |  | sim |
| coletas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| coletas_qtd_volumes_nonneg | CHECK | `CHECK (qtd_volumes IS NULL OR qtd_volumes >= 0)` |  |  | sim |
| fk_coletas_fornecedor | FOREIGN KEY | `FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| fk_coletas_transportadora | FOREIGN KEY | `FOREIGN KEY (transportadora_id) REFERENCES transportadoras(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.ocorrencias | ocorrencias_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_alertas | rastreamento_alertas_coleta_id_fkey | coleta_id | SET NULL |
| public.rastreamento_historico | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_historico_y2026m01 | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_historico_y2026m02 | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_historico_y2026m03 | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_historico_y2026m04 | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_historico_y2026m05 | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_historico_y2026m06 | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_historico_y2026m07 | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_historico_y2026m08 | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_historico_y2026m09 | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_historico_y2026m10 | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_historico_y2026m11 | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_historico_y2026m12 | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_historico_y2027m01 | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_historico_y2027m02 | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_historico_y2027m03 | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_historico_y2027m04 | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_historico_y2027m05 | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |
| public.rastreamento_historico_y2027m06 | rastreamento_historico_coleta_id_fkey | coleta_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| coletas_numero_coleta_key | btree | numero_coleta | sim | sim |  | `CREATE UNIQUE INDEX coletas_numero_coleta_key ON public.coletas USING btree (numero_coleta)` |
| coletas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX coletas_pkey ON public.coletas USING btree (id)` |
| idx_coletas_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_coletas_created_at ON public.coletas USING btree (created_at DESC)` |
| idx_coletas_deleted_at | btree | deleted_at | não | sim | `(deleted_at IS NULL)` | `CREATE INDEX idx_coletas_deleted_at ON public.coletas USING btree (deleted_at) WHERE (deleted_at IS NULL)` |
| idx_coletas_flags | btree | is_reverse, is_urgent, status | não | sim |  | `CREATE INDEX idx_coletas_flags ON public.coletas USING btree (is_reverse, is_urgent, status)` |
| idx_coletas_fornecedor_id | btree | fornecedor_id | não | sim |  | `CREATE INDEX idx_coletas_fornecedor_id ON public.coletas USING btree (fornecedor_id)` |
| idx_coletas_numero_coleta_trgm | gin | numero_coleta | não | sim |  | `CREATE INDEX idx_coletas_numero_coleta_trgm ON public.coletas USING gin (numero_coleta gin_trgm_ops)` |
| idx_coletas_prevista_pendente | btree | data_prevista_coleta | não | sim | `(data_efetiva_coleta IS NULL)` | `CREATE INDEX idx_coletas_prevista_pendente ON public.coletas USING btree (data_prevista_coleta) WHERE (data_efetiva_coleta IS NULL)` |
| idx_coletas_status_created_at | btree | status, created_at | não | sim |  | `CREATE INDEX idx_coletas_status_created_at ON public.coletas USING btree (status, created_at DESC)` |
| idx_coletas_status_data | btree | status, data_prevista_coleta | não | sim |  | `CREATE INDEX idx_coletas_status_data ON public.coletas USING btree (status, data_prevista_coleta DESC)` |
| idx_coletas_transp_status | btree | transportadora_id, status | não | sim |  | `CREATE INDEX idx_coletas_transp_status ON public.coletas USING btree (transportadora_id, status)` |
| idx_coletas_transportadora_id | btree | transportadora_id | não | sim |  | `CREATE INDEX idx_coletas_transportadora_id ON public.coletas USING btree (transportadora_id)` |


## Policies (RLS)

### `Admins can delete coletas`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can update coletas`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Auth users can insert coletas`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() IS NOT NULL)` |

### `Authenticated users can view coletas`

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
| a_valida_transicao_coletas | BEFORE | UPDATE | ROW | enabled | public.fn_tr_valida_transicao_coleta |
| audit_log_trigger | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_log_trigger |
| generate_coleta_numero_trigger | BEFORE | INSERT | ROW | enabled | public.generate_coleta_numero |
| tr_increment_coletas_version | BEFORE | UPDATE | ROW | enabled | public.increment_version_column |
| trigger_notify_coleta_atrasada | AFTER | UPDATE | ROW | enabled | public.notify_coleta_atrasada |
| update_coletas_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

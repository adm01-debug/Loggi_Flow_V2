# public.transportadoras

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
| 2 | `razao_social` | `text` | não |  |  |  |
| 3 | `cnpj` | `text` | não |  |  |  |
| 4 | `nome_fantasia` | `text` | não |  |  |  |
| 5 | `contato_comercial` | `text` | não |  |  |  |
| 6 | `email_comercial` | `text` | não |  |  |  |
| 7 | `whatsapp_operacional` | `text` | sim |  |  |  |
| 8 | `regioes_atendidas` | `text[]` | sim | `'{}'::text[]` |  |  |
| 9 | `prazo_medio_dias` | `integer` | sim |  |  |  |
| 10 | `api_disponivel` | `boolean` | sim | `false` |  |  |
| 11 | `url_rastreamento` | `text` | sim |  |  |  |
| 12 | `homologada` | `boolean` | sim | `true` |  |  |
| 13 | `data_homologacao` | `timestamp with time zone` | sim | `now()` |  |  |
| 14 | `score_performance` | `integer` | sim | `0` |  |  |
| 15 | `observacoes` | `text` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 18 | `deleted_at` | `timestamp with time zone` | sim |  |  |  |
| 19 | `version` | `integer` | sim | `1` |  |  |
| 20 | `credentials` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 21 | `coverage_details` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 22 | `non_api_config` | `jsonb` | sim | `'{}'::jsonb` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| transportadoras_cnpj_key | UNIQUE | `UNIQUE (cnpj)` |  |  | sim |
| transportadoras_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.alertas_custo | alertas_custo_transportadora_id_fkey | transportadora_id | CASCADE |
| public.carrier_rankings | carrier_rankings_transportadora_id_fkey | transportadora_id | CASCADE |
| public.coletas | fk_coletas_transportadora | transportadora_id | SET NULL |
| public.cotacoes_frete | cotacoes_frete_transportadora_id_fkey | transportadora_id | NO ACTION |
| public.cotacoes_multicanal | cotacoes_multicanal_transportadora_id_fkey | transportadora_id | CASCADE |
| public.entregas | entregas_transportadora_id_fkey | transportadora_id | NO ACTION |
| public.freight_decisions | freight_decisions_selected_carrier_id_fkey | selected_carrier_id | NO ACTION |
| public.freight_integration_mappings | freight_integration_mappings_transportadora_id_fkey | transportadora_id | NO ACTION |
| public.freight_webhooks | freight_webhooks_transportadora_id_fkey | transportadora_id | CASCADE |
| public.tabelas_frete | tabelas_frete_transportadora_id_fkey | transportadora_id | CASCADE |
| public.transportadora_rotas | transportadora_rotas_transportadora_id_fkey | transportadora_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_transportadoras_deleted_at | btree | deleted_at | não | sim | `(deleted_at IS NULL)` | `CREATE INDEX idx_transportadoras_deleted_at ON public.transportadoras USING btree (deleted_at) WHERE (deleted_at IS NULL)` |
| transportadoras_cnpj_key | btree | cnpj | sim | sim |  | `CREATE UNIQUE INDEX transportadoras_cnpj_key ON public.transportadoras USING btree (cnpj)` |
| transportadoras_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX transportadoras_pkey ON public.transportadoras USING btree (id)` |


## Policies (RLS)

### `Admins can delete transportadoras`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can insert transportadoras`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins can update transportadoras`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Authenticated users can view transportadoras`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| audit_log_trigger | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_log_trigger |
| tr_increment_version_transportadoras | BEFORE | UPDATE | ROW | enabled | public.increment_version_column |
| tr_transportadoras_optimistic_locking | BEFORE | UPDATE | ROW | enabled | public.handle_optimistic_locking |
| update_transportadoras_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

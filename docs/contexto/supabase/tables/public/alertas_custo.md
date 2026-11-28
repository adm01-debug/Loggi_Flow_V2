# public.alertas_custo

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
| 2 | `tipo` | `text` | não |  |  |  |
| 3 | `transportadora_id` | `uuid` | sim |  |  |  |
| 4 | `estado_destino` | `text` | sim |  |  |  |
| 5 | `limite_mensal` | `numeric` | não |  |  |  |
| 6 | `limite_por_entrega` | `numeric` | sim |  |  |  |
| 7 | `ativo` | `boolean` | não | `true` |  |  |
| 8 | `notificar_percentual` | `integer` | não | `80` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `created_by` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| alertas_custo_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| alertas_custo_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| alertas_custo_tipo_check | CHECK | `CHECK (tipo = ANY (ARRAY['transportadora'::text, 'rota'::text, 'global'::text]))` |  |  | sim |
| alertas_custo_transportadora_id_fkey | FOREIGN KEY | `FOREIGN KEY (transportadora_id) REFERENCES transportadoras(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.notificacoes_custo | notificacoes_custo_alerta_id_fkey | alerta_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| alertas_custo_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX alertas_custo_pkey ON public.alertas_custo USING btree (id)` |
| idx_alertas_custo_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_alertas_custo_created_by ON public.alertas_custo USING btree (created_by)` |
| idx_alertas_custo_estado | btree | estado_destino | não | sim |  | `CREATE INDEX idx_alertas_custo_estado ON public.alertas_custo USING btree (estado_destino)` |
| idx_alertas_custo_tipo | btree | tipo | não | sim |  | `CREATE INDEX idx_alertas_custo_tipo ON public.alertas_custo USING btree (tipo)` |
| idx_alertas_custo_transportadora_id | btree | transportadora_id | não | sim |  | `CREATE INDEX idx_alertas_custo_transportadora_id ON public.alertas_custo USING btree (transportadora_id)` |


## Policies (RLS)

### `Admins can delete alertas_custo`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can insert alertas_custo`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins can update alertas_custo`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins can view alertas_custo`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| audit_log_trigger | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_log_trigger |
| update_alertas_custo_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

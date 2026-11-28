# public.freight_integration_mappings

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `transportadora_id` | `uuid` | sim |  |  |  |
| 3 | `source_type` | `text` | não |  |  |  |
| 4 | `mapping_config` | `jsonb` | não |  |  |  |
| 5 | `is_active` | `boolean` | sim | `true` |  |  |
| 6 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| freight_integration_mappings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| freight_integration_mappings_transportadora_id_fkey | FOREIGN KEY | `FOREIGN KEY (transportadora_id) REFERENCES transportadoras(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| freight_integration_mappings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX freight_integration_mappings_pkey ON public.freight_integration_mappings USING btree (id)` |
| idx_freight_integration_mappings_transportadora_id | btree | transportadora_id | não | sim |  | `CREATE INDEX idx_freight_integration_mappings_transportadora_id ON public.freight_integration_mappings USING btree (transportadora_id)` |


## Policies (RLS)

### `Admins manage integration mappings`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Allow read for mappings`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

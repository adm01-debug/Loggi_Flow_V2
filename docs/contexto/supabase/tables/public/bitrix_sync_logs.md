# public.bitrix_sync_logs

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `config_id` | `uuid` | sim |  |  |  |
| 3 | `status` | `text` | não |  |  |  |
| 4 | `synced_items_count` | `integer` | sim | `0` |  |  |
| 5 | `error_message` | `text` | sim |  |  |  |
| 6 | `details` | `jsonb` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bitrix_sync_logs_config_id_fkey | FOREIGN KEY | `FOREIGN KEY (config_id) REFERENCES bitrix_sync_config(id)` | NO ACTION | NO ACTION | sim |
| bitrix_sync_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bitrix_sync_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX bitrix_sync_logs_pkey ON public.bitrix_sync_logs USING btree (id)` |
| idx_bitrix_sync_logs_config_id | btree | config_id | não | sim |  | `CREATE INDEX idx_bitrix_sync_logs_config_id ON public.bitrix_sync_logs USING btree (config_id)` |


## Policies (RLS)

### `Admins manage bitrix_sync_logs`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

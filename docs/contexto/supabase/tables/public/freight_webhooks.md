# public.freight_webhooks

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
| 2 | `transportadora_id` | `uuid` | sim |  |  |  |
| 3 | `endpoint_url` | `text` | não |  |  |  |
| 4 | `secret_key` | `text` | sim |  |  |  |
| 5 | `event_type` | `text` | não |  |  |  |
| 6 | `is_active` | `boolean` | sim | `true` |  |  |
| 7 | `last_called_at` | `timestamp with time zone` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| freight_webhooks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| freight_webhooks_transportadora_id_fkey | FOREIGN KEY | `FOREIGN KEY (transportadora_id) REFERENCES transportadoras(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| freight_webhooks_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX freight_webhooks_pkey ON public.freight_webhooks USING btree (id)` |
| idx_freight_webhooks_transportadora_id | btree | transportadora_id | não | sim |  | `CREATE INDEX idx_freight_webhooks_transportadora_id ON public.freight_webhooks USING btree (transportadora_id)` |


## Policies (RLS)

### `Admins manage freight_webhooks`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_freight_webhooks_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

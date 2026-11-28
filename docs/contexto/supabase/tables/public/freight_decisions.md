# public.freight_decisions

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
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `request_params` | `jsonb` | não |  |  |  |
| 4 | `selected_carrier_id` | `uuid` | sim |  |  |  |
| 5 | `selected_carrier_name` | `text` | sim |  |  |  |
| 6 | `recommendations` | `jsonb` | não |  |  |  |
| 7 | `rule_applied` | `jsonb` | sim |  |  |  |
| 8 | `status` | `text` | sim | `'success'::text` |  |  |
| 9 | `error_message` | `text` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| freight_decisions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| freight_decisions_selected_carrier_id_fkey | FOREIGN KEY | `FOREIGN KEY (selected_carrier_id) REFERENCES transportadoras(id)` | NO ACTION | NO ACTION | sim |
| freight_decisions_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| freight_decisions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX freight_decisions_pkey ON public.freight_decisions USING btree (id)` |
| idx_freight_decisions_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_freight_decisions_created_at ON public.freight_decisions USING btree (created_at DESC)` |
| idx_freight_decisions_selected_carrier_id | btree | selected_carrier_id | não | sim |  | `CREATE INDEX idx_freight_decisions_selected_carrier_id ON public.freight_decisions USING btree (selected_carrier_id)` |
| idx_freight_decisions_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_freight_decisions_user_id ON public.freight_decisions USING btree (user_id)` |


## Policies (RLS)

### `Service role inserts decisions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | service_role |
| USING |  |
| WITH CHECK | `true` |

### `Users can view their own freight decisions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((auth.uid() = user_id) OR (auth.role() = 'service_role'::text))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

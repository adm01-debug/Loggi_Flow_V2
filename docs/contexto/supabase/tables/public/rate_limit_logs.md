# public.rate_limit_logs

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `ip_address` | `text` | não |  |  |  |
| 3 | `endpoint` | `text` | não |  |  |  |
| 4 | `user_id` | `uuid` | sim |  |  |  |
| 5 | `request_count` | `integer` | não | `1` |  |  |
| 6 | `blocked` | `boolean` | não | `false` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `window_start` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rate_limit_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| rate_limit_logs_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_rate_limit_ip_endpoint | btree | ip_address, endpoint, window_start | não | sim |  | `CREATE INDEX idx_rate_limit_ip_endpoint ON public.rate_limit_logs USING btree (ip_address, endpoint, window_start DESC)` |
| idx_rate_limit_logs_blocked | btree | blocked | não | sim |  | `CREATE INDEX idx_rate_limit_logs_blocked ON public.rate_limit_logs USING btree (blocked)` |
| idx_rate_limit_logs_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_rate_limit_logs_created_at ON public.rate_limit_logs USING btree (created_at)` |
| idx_rate_limit_logs_endpoint_created | btree | endpoint, created_at | não | sim |  | `CREATE INDEX idx_rate_limit_logs_endpoint_created ON public.rate_limit_logs USING btree (endpoint, created_at DESC)` |
| idx_rate_limit_logs_ip | btree | ip_address | não | sim |  | `CREATE INDEX idx_rate_limit_logs_ip ON public.rate_limit_logs USING btree (ip_address)` |
| idx_rate_limit_logs_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_rate_limit_logs_user_id ON public.rate_limit_logs USING btree (user_id)` |
| rate_limit_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rate_limit_logs_pkey ON public.rate_limit_logs USING btree (id)` |


## Policies (RLS)

### `Admins can delete rate limit logs`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can view rate limit logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Strict insert rate limit logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() IS NOT NULL)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.rte_gateway_health

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
| 2 | `gateway` | `text` | não |  |  |  |
| 3 | `online` | `boolean` | não |  |  |  |
| 4 | `http_status` | `integer` | não | `0` |  |  |
| 5 | `latency_ms` | `integer` | não | `0` |  |  |
| 6 | `error_message` | `text` | sim |  |  |  |
| 7 | `checked_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rte_gateway_health_latency_positive | CHECK | `CHECK (latency_ms >= 0)` |  |  | sim |
| rte_gateway_health_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| rte_gateway_health_status_range | CHECK | `CHECK (http_status >= 0 AND http_status < 600)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_rte_gateway_health_checked_at | btree | checked_at | não | sim |  | `CREATE INDEX idx_rte_gateway_health_checked_at ON public.rte_gateway_health USING btree (checked_at DESC)` |
| idx_rte_gateway_health_gateway_checked_at | btree | gateway, checked_at | não | sim |  | `CREATE INDEX idx_rte_gateway_health_gateway_checked_at ON public.rte_gateway_health USING btree (gateway, checked_at DESC)` |
| rte_gateway_health_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rte_gateway_health_pkey ON public.rte_gateway_health USING btree (id)` |


## Policies (RLS)

### `Admins can delete gateway health history`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Authenticated users can read gateway health`

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

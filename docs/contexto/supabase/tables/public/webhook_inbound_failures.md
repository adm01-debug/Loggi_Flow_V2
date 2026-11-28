# public.webhook_inbound_failures

> Etapa 288 - falha de webhook de entrada por receptor. Sem payload (LGPD).

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
| 2 | `receiver` | `text` | não |  |  | Edge function que recebeu: carrier-webhook-receiver, rodonaves-webhook, ... |
| 3 | `provider` | `text` | sim |  |  | Provedor declarado no payload (carrier_id), quando ele ainda e legivel. |
| 4 | `event_id` | `text` | sim |  |  |  |
| 5 | `response_status` | `integer` | não | `500` |  |  |
| 6 | `error_message` | `text` | não |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| webhook_inbound_failures_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_webhook_inbound_failures_created | btree | created_at | não | sim |  | `CREATE INDEX idx_webhook_inbound_failures_created ON public.webhook_inbound_failures USING btree (created_at DESC)` |
| webhook_inbound_failures_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX webhook_inbound_failures_pkey ON public.webhook_inbound_failures USING btree (id)` |


## Policies (RLS)

### `Admins can view webhook inbound failures`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `System can insert webhook inbound failures`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | service_role |
| USING |  |
| WITH CHECK | `true` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

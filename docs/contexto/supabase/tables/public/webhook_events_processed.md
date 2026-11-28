# public.webhook_events_processed

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
| 2 | `event_id` | `text` | não |  |  |  |
| 3 | `provider` | `text` | não |  |  |  |
| 4 | `processed_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 5 | `payload` | `jsonb` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| webhook_events_processed_event_id_provider_key | UNIQUE | `UNIQUE (event_id, provider)` |  |  | sim |
| webhook_events_processed_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| webhook_events_processed_event_id_provider_key | btree | event_id, provider | sim | sim |  | `CREATE UNIQUE INDEX webhook_events_processed_event_id_provider_key ON public.webhook_events_processed USING btree (event_id, provider)` |
| webhook_events_processed_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX webhook_events_processed_pkey ON public.webhook_events_processed USING btree (id)` |


## Policies (RLS)

### `Admins can view webhook logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() IN ( SELECT profiles.id    FROM profiles   WHERE (profiles.cargo = 'admin'::text)))` |
| WITH CHECK |  |

### `Admins read webhook processing`

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


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

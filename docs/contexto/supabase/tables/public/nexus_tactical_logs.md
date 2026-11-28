# public.nexus_tactical_logs

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `vehicle_id` | `text` | sim |  |  |  |
| 3 | `event_time` | `timestamp with time zone` | não | `now()` |  |  |
| 4 | `message` | `text` | não |  |  |  |
| 5 | `type` | `text` | não |  |  |  |
| 6 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `target_vehicle` | `text` | sim |  |  |  |
| 9 | `protocol_executed` | `boolean` | sim | `false` |  |  |
| 10 | `alert_metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| nexus_tactical_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| nexus_tactical_logs_type_check | CHECK | `CHECK (type = ANY (ARRAY['info'::text, 'warn'::text, 'crit'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| brin_nexus_tactical_logs_created_at | brin | created_at | não | sim |  | `CREATE INDEX brin_nexus_tactical_logs_created_at ON public.nexus_tactical_logs USING brin (created_at) WITH (pages_per_range='32')` |
| idx_logs_time | btree | event_time | não | sim |  | `CREATE INDEX idx_logs_time ON public.nexus_tactical_logs USING btree (event_time)` |
| idx_logs_vehicle | btree | vehicle_id | não | sim |  | `CREATE INDEX idx_logs_vehicle ON public.nexus_tactical_logs USING btree (vehicle_id)` |
| nexus_tactical_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX nexus_tactical_logs_pkey ON public.nexus_tactical_logs USING btree (id)` |


## Policies (RLS)

### `Admins insert tactical logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Authenticated read tactical logs`

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
| on_critical_alert_bitrix_sync | AFTER | INSERT | ROW | enabled | public.trigger_bitrix_alert_notification |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.bio_sync_telemetry

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
| 2 | `driver_id` | `text` | não |  |  |  |
| 3 | `vehicle_id` | `text` | não |  |  |  |
| 4 | `heart_rate` | `integer` | não |  |  |  |
| 5 | `fatigue_index` | `text` | não |  |  |  |
| 6 | `timestamp` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `severity` | `text` | sim | `'info'::text` |  |  |
| 9 | `cause` | `text` | sim |  |  |  |
| 10 | `suggested_action` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| bio_sync_telemetry_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| bio_sync_telemetry_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX bio_sync_telemetry_pkey ON public.bio_sync_telemetry USING btree (id)` |
| brin_bio_sync_telemetry_created_at | brin | created_at | não | sim |  | `CREATE INDEX brin_bio_sync_telemetry_created_at ON public.bio_sync_telemetry USING brin (created_at) WITH (pages_per_range='32')` |
| idx_bio_time | btree | timestamp | não | sim |  | `CREATE INDEX idx_bio_time ON public.bio_sync_telemetry USING btree ("timestamp")` |


## Policies (RLS)

### `Admins insert bio telemetry`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Authenticated read bio telemetry`

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
| tr_log_biometric_anomaly | AFTER | INSERT | ROW | enabled | public.log_biometric_anomaly |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

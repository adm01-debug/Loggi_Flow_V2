# public.performance_metrics

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
| 2 | `entity_id` | `uuid` | não |  |  |  |
| 3 | `entity_type` | `text` | não |  |  |  |
| 4 | `period_start` | `date` | não |  |  |  |
| 5 | `period_end` | `date` | não |  |  |  |
| 6 | `total_freights` | `integer` | sim | `0` |  |  |
| 7 | `on_time_deliveries` | `integer` | sim | `0` |  |  |
| 8 | `late_deliveries` | `integer` | sim | `0` |  |  |
| 9 | `sla_compliance_rate` | `numeric(5,2)` | sim |  |  |  |
| 10 | `average_lead_time_hours` | `numeric(10,2)` | sim |  |  |  |
| 11 | `efficiency_score` | `numeric(5,2)` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| performance_metrics_entity_type_check | CHECK | `CHECK (entity_type = ANY (ARRAY['carrier'::text, 'driver'::text]))` |  |  | sim |
| performance_metrics_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| performance_metrics_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX performance_metrics_pkey ON public.performance_metrics USING btree (id)` |


## Policies (RLS)

### `Admins manage performance_metrics`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Authenticated read performance_metrics`

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
| trg_performance_metrics_updated_at | BEFORE | UPDATE | ROW | enabled | public.handle_updated_at |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.db_health_score_history

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
| 2 | `captured_at` | `timestamp with time zone` | não | `now()` |  |  |
| 3 | `overall_score` | `numeric` | não |  |  |  |
| 4 | `grade` | `text` | não |  |  |  |
| 5 | `slo_score` | `numeric` | não |  |  |  |
| 6 | `anomaly_score` | `numeric` | não |  |  |  |
| 7 | `mttr_score` | `numeric` | não |  |  |  |
| 8 | `capacity_score` | `numeric` | não |  |  |  |
| 9 | `details` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| db_health_score_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| db_health_score_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX db_health_score_history_pkey ON public.db_health_score_history USING btree (id)` |
| idx_health_score_history_captured | btree | captured_at | não | sim |  | `CREATE INDEX idx_health_score_history_captured ON public.db_health_score_history USING btree (captured_at DESC)` |


## Policies (RLS)

### `Admins can view health score history`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.db_health_snapshots

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
| 2 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 3 | `active_connections` | `integer` | sim |  |  |  |
| 4 | `total_connections` | `integer` | sim |  |  |  |
| 5 | `db_size_bytes` | `bigint` | sim |  |  |  |
| 6 | `cache_hit_ratio` | `numeric` | sim |  |  |  |
| 7 | `deadlocks` | `bigint` | sim |  |  |  |
| 8 | `wal_size_bytes` | `bigint` | sim |  |  |  |
| 9 | `metadata` | `jsonb` | não | `'{}'::jsonb` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| db_health_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| db_health_snapshots_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX db_health_snapshots_pkey ON public.db_health_snapshots USING btree (id)` |
| idx_db_health_snapshots_created_at_brin | brin | created_at | não | sim |  | `CREATE INDEX idx_db_health_snapshots_created_at_brin ON public.db_health_snapshots USING brin (created_at)` |


## Policies (RLS)

### `Admins can view db health snapshots`

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

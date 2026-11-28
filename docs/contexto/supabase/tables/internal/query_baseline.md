# internal.query_baseline

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | não |
| RLS forçado (owner) | não |
| policies | 0 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `bigint` | não | `nextval('internal.query_baseline_id_seq'::regclass)` |  |  |
| 2 | `captured_at` | `timestamp with time zone` | não | `now()` |  |  |
| 3 | `queryid` | `bigint` | não |  |  |  |
| 4 | `query_text` | `text` | não |  |  |  |
| 5 | `calls` | `bigint` | não |  |  |  |
| 6 | `total_exec_time` | `double precision` | não |  |  |  |
| 7 | `mean_exec_time` | `double precision` | não |  |  |  |
| 8 | `rows_processed` | `bigint` | não |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| query_baseline_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_query_baseline_captured_at | btree | captured_at | não | sim |  | `CREATE INDEX idx_query_baseline_captured_at ON internal.query_baseline USING btree (captured_at DESC)` |
| idx_query_baseline_queryid | btree | queryid, captured_at | não | sim |  | `CREATE INDEX idx_query_baseline_queryid ON internal.query_baseline USING btree (queryid, captured_at DESC)` |
| query_baseline_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX query_baseline_pkey ON internal.query_baseline USING btree (id)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_

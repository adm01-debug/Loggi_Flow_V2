# audit_tmp.job_test

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
| 1 | `fn` | `text` | não |  |  |  |
| 2 | `ok` | `boolean` | sim |  |  |  |
| 3 | `result` | `text` | sim |  |  |  |
| 4 | `ms` | `integer` | sim |  |  |  |
| 5 | `at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| job_test_pkey | PRIMARY KEY | `PRIMARY KEY (fn)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| job_test_pkey | btree | fn | sim | sim |  | `CREATE UNIQUE INDEX job_test_pkey ON audit_tmp.job_test USING btree (fn)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_

# audit_tmp.seed_backup

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
| 1 | `tbl` | `text` | não |  |  |  |
| 2 | `n` | `integer` | sim |  |  |  |
| 3 | `rows` | `jsonb` | sim |  |  |  |
| 4 | `taken_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| seed_backup_pkey | PRIMARY KEY | `PRIMARY KEY (tbl)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| seed_backup_pkey | btree | tbl | sim | sim |  | `CREATE UNIQUE INDEX seed_backup_pkey ON audit_tmp.seed_backup USING btree (tbl)` |


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_

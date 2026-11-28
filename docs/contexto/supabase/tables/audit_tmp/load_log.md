# audit_tmp.load_log

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
| usada por views | audit_tmp.v_migration_status |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `name` | `text` | sim |  |  |  |
| 2 | `tbl` | `text` | sim |  |  |  |
| 3 | `inserted` | `integer` | sim |  |  |  |
| 4 | `err` | `text` | sim |  |  |  |
| 5 | `at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

_nenhum_


## Índices

_nenhum_


## Policies (RLS)

> ⚠️ RLS **desabilitado** nesta tabela.



## Triggers

_nenhum_


## Grants

_nenhum_

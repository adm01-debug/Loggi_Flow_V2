# public.system_heartbeat

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
| 1 | `service_name` | `text` | não |  |  |  |
| 2 | `status` | `text` | não |  |  |  |
| 3 | `latency_ms` | `integer` | sim |  |  |  |
| 4 | `last_check` | `timestamp with time zone` | não | `now()` |  |  |
| 5 | `version` | `text` | sim |  |  |  |
| 6 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| system_heartbeat_pkey | PRIMARY KEY | `PRIMARY KEY (service_name)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| system_heartbeat_pkey | btree | service_name | sim | sim |  | `CREATE UNIQUE INDEX system_heartbeat_pkey ON public.system_heartbeat USING btree (service_name)` |


## Policies (RLS)

### `Heartbeat visível a usuários autenticados`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

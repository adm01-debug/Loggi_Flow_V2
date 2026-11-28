# public.kanban_history

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
| 2 | `delivery_id` | `uuid` | não |  |  |  |
| 3 | `from_status` | `text` | sim |  |  |  |
| 4 | `to_status` | `text` | não |  |  |  |
| 5 | `action_by` | `uuid` | sim |  |  |  |
| 6 | `notes` | `text` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| kanban_history_action_by_fkey | FOREIGN KEY | `FOREIGN KEY (action_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| kanban_history_delivery_id_fkey | FOREIGN KEY | `FOREIGN KEY (delivery_id) REFERENCES entregas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| kanban_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_kanban_history_action_by | btree | action_by | não | sim |  | `CREATE INDEX idx_kanban_history_action_by ON public.kanban_history USING btree (action_by)` |
| idx_kanban_history_delivery_id | btree | delivery_id | não | sim |  | `CREATE INDEX idx_kanban_history_delivery_id ON public.kanban_history USING btree (delivery_id)` |
| kanban_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX kanban_history_pkey ON public.kanban_history USING btree (id)` |


## Policies (RLS)

### `Authenticated insert kanban history`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() IS NOT NULL)` |

### `Authenticated view kanban history`

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
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.audit_logs_y2027m05

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
| partição de | public.audit_logs |
| bound | `FOR VALUES FROM ('2027-05-01 00:00:00+00') TO ('2027-06-01 00:00:00+00')` |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `table_name` | `text` | não |  |  |  |
| 3 | `record_id` | `text` | não |  |  |  |
| 4 | `action` | `text` | não |  |  |  |
| 5 | `old_data` | `jsonb` | sim |  |  |  |
| 6 | `new_data` | `jsonb` | sim |  |  |  |
| 7 | `changed_fields` | `text[]` | sim |  |  |  |
| 8 | `user_id` | `uuid` | sim |  |  |  |
| 9 | `user_email` | `text` | sim |  |  |  |
| 10 | `user_name` | `text` | sim |  |  |  |
| 11 | `ip_address` | `text` | sim |  |  |  |
| 12 | `user_agent` | `text` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| audit_logs_y2027m05_pkey | PRIMARY KEY | `PRIMARY KEY (id, created_at)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| audit_logs_y2027m05_changed_fields_idx | gin | changed_fields | não | sim |  | `CREATE INDEX audit_logs_y2027m05_changed_fields_idx ON public.audit_logs_y2027m05 USING gin (changed_fields)` |
| audit_logs_y2027m05_created_at_idx | btree | created_at | não | sim |  | `CREATE INDEX audit_logs_y2027m05_created_at_idx ON public.audit_logs_y2027m05 USING btree (created_at DESC)` |
| audit_logs_y2027m05_new_data_idx | gin | new_data | não | sim |  | `CREATE INDEX audit_logs_y2027m05_new_data_idx ON public.audit_logs_y2027m05 USING gin (new_data)` |
| audit_logs_y2027m05_old_data_idx | gin | old_data | não | sim |  | `CREATE INDEX audit_logs_y2027m05_old_data_idx ON public.audit_logs_y2027m05 USING gin (old_data)` |
| audit_logs_y2027m05_pkey | btree | id, created_at | sim | sim |  | `CREATE UNIQUE INDEX audit_logs_y2027m05_pkey ON public.audit_logs_y2027m05 USING btree (id, created_at)` |
| audit_logs_y2027m05_record_id_created_at_idx | btree | record_id, created_at | não | sim |  | `CREATE INDEX audit_logs_y2027m05_record_id_created_at_idx ON public.audit_logs_y2027m05 USING btree (record_id, created_at DESC)` |
| audit_logs_y2027m05_record_id_table_name_created_at_idx | btree | record_id, table_name, created_at | não | sim |  | `CREATE INDEX audit_logs_y2027m05_record_id_table_name_created_at_idx ON public.audit_logs_y2027m05 USING btree (record_id, table_name, created_at DESC)` |
| audit_logs_y2027m05_table_name_action_created_at_idx | btree | table_name, action, created_at | não | sim |  | `CREATE INDEX audit_logs_y2027m05_table_name_action_created_at_idx ON public.audit_logs_y2027m05 USING btree (table_name, action, created_at DESC)` |
| audit_logs_y2027m05_user_id_created_at_idx | btree | user_id, created_at | não | sim | `(user_id IS NOT NULL)` | `CREATE INDEX audit_logs_y2027m05_user_id_created_at_idx ON public.audit_logs_y2027m05 USING btree (user_id, created_at DESC) WHERE (user_id IS NOT NULL)` |


## Policies (RLS)

### `Admins view audit logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Authenticated insert audit logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() IS NOT NULL)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.audit_logs

| propriedade | valor |
|---|---|
| tipo | partitioned |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| chave de partição | `RANGE (created_at)` |


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
| audit_logs_partitioned_pkey | PRIMARY KEY | `PRIMARY KEY (id, created_at)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| audit_logs_partitioned_pkey | btree | id, created_at | sim | sim |  | `CREATE UNIQUE INDEX audit_logs_partitioned_pkey ON ONLY public.audit_logs USING btree (id, created_at)` |
| gin_audit_logs_changed_fields | gin | changed_fields | não | sim |  | `CREATE INDEX gin_audit_logs_changed_fields ON ONLY public.audit_logs USING gin (changed_fields)` |
| idx_audit_logs_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_audit_logs_created_at ON ONLY public.audit_logs USING btree (created_at DESC)` |
| idx_audit_logs_new_data_gin | gin | new_data | não | sim |  | `CREATE INDEX idx_audit_logs_new_data_gin ON ONLY public.audit_logs USING gin (new_data)` |
| idx_audit_logs_old_data_gin | gin | old_data | não | sim |  | `CREATE INDEX idx_audit_logs_old_data_gin ON ONLY public.audit_logs USING gin (old_data)` |
| idx_audit_logs_record_composite | btree | record_id, table_name, created_at | não | sim |  | `CREATE INDEX idx_audit_logs_record_composite ON ONLY public.audit_logs USING btree (record_id, table_name, created_at DESC)` |
| idx_audit_logs_record_id_created | btree | record_id, created_at | não | sim |  | `CREATE INDEX idx_audit_logs_record_id_created ON ONLY public.audit_logs USING btree (record_id, created_at DESC)` |
| idx_audit_logs_table_action_created | btree | table_name, action, created_at | não | sim |  | `CREATE INDEX idx_audit_logs_table_action_created ON ONLY public.audit_logs USING btree (table_name, action, created_at DESC)` |
| idx_audit_logs_user_created | btree | user_id, created_at | não | sim | `(user_id IS NOT NULL)` | `CREATE INDEX idx_audit_logs_user_created ON ONLY public.audit_logs USING btree (user_id, created_at DESC) WHERE (user_id IS NOT NULL)` |


## Policies (RLS)

### `Allow admins to view audit logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))))` |
| WITH CHECK |  |

### `Authenticated can insert audit logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() IS NOT NULL)` |

### `Strict insert audit logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() IS NOT NULL)` |

### `Users can view their organization's audit logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(user_id IN ( SELECT profiles.id    FROM profiles   WHERE (profiles.organization_id = get_current_organization_id())))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

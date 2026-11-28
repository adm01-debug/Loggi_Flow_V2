# public.security_events

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | sim |  |  |  |
| 3 | `event_type` | `text` | não |  |  |  |
| 4 | `severity` | `text` | não | `'info'::text` |  |  |
| 5 | `description` | `text` | não |  |  |  |
| 6 | `ip_address` | `text` | sim |  |  |  |
| 7 | `user_agent` | `text` | sim |  |  |  |
| 8 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| security_events_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| security_events_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_security_events_created | btree | created_at | não | sim |  | `CREATE INDEX idx_security_events_created ON public.security_events USING btree (created_at)` |
| idx_security_events_severity | btree | severity | não | sim |  | `CREATE INDEX idx_security_events_severity ON public.security_events USING btree (severity)` |
| idx_security_events_type | btree | event_type | não | sim |  | `CREATE INDEX idx_security_events_type ON public.security_events USING btree (event_type)` |
| idx_security_events_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_security_events_user_id ON public.security_events USING btree (user_id)` |
| idx_security_events_user_time | btree | user_id, created_at | não | sim |  | `CREATE INDEX idx_security_events_user_time ON public.security_events USING btree (user_id, created_at DESC)` |
| security_events_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX security_events_pkey ON public.security_events USING btree (id)` |


## Policies (RLS)

### `Admins can view security events`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Strict insert security events`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() IS NOT NULL)` |

### `Users can insert their own security events`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `((auth.uid() IS NOT NULL) AND ((user_id IS NULL) OR (user_id = auth.uid())))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| audit_log_trigger | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_log_trigger |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

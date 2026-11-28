# public.notifications

> User notifications with realtime support

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `title` | `text` | não |  |  |  |
| 4 | `message` | `text` | não |  |  |  |
| 5 | `type` | `notification_type` | não | `'info'::notification_type` |  |  |
| 6 | `read` | `boolean` | não | `false` |  |  |
| 7 | `action_url` | `text` | sim |  |  |  |
| 8 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `read_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| notifications_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| notifications_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| gin_notifications_metadata | gin | metadata | não | sim |  | `CREATE INDEX gin_notifications_metadata ON public.notifications USING gin (metadata)` |
| idx_notifications_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC)` |
| idx_notifications_read | btree | read | não | sim |  | `CREATE INDEX idx_notifications_read ON public.notifications USING btree (read)` |
| idx_notifications_unread | btree | user_id | não | sim | `(read = false)` | `CREATE INDEX idx_notifications_unread ON public.notifications USING btree (user_id) WHERE (read = false)` |
| idx_notifications_user_created | btree | user_id, created_at | não | sim |  | `CREATE INDEX idx_notifications_user_created ON public.notifications USING btree (user_id, created_at DESC)` |
| idx_notifications_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id)` |
| idx_notifications_user_read | btree | user_id, read, created_at | não | sim |  | `CREATE INDEX idx_notifications_user_read ON public.notifications USING btree (user_id, read, created_at DESC)` |
| idx_notifications_user_unread_created | btree | user_id, created_at | não | sim | `(read = false)` | `CREATE INDEX idx_notifications_user_unread_created ON public.notifications USING btree (user_id, created_at DESC) WHERE (read = false)` |
| notifications_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id)` |


## Policies (RLS)

### `Strict insert notifications`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() IS NOT NULL)` |

### `Users can create their own notifications`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can delete their own notifications`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can update their own notifications`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own notifications`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


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

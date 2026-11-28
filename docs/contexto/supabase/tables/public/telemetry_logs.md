# public.telemetry_logs

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
| 2 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 3 | `severity` | `text` | não |  |  |  |
| 4 | `category` | `text` | não |  |  |  |
| 5 | `message` | `text` | não |  |  |  |
| 6 | `stack_trace` | `text` | sim |  |  |  |
| 7 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 8 | `user_id` | `uuid` | sim |  |  |  |
| 9 | `device_info` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 10 | `url` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| telemetry_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| telemetry_logs_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['info'::text, 'warning'::text, 'error'::text, 'critical'::text]))` |  |  | sim |
| telemetry_logs_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_telemetry_logs_category | btree | category | não | sim |  | `CREATE INDEX idx_telemetry_logs_category ON public.telemetry_logs USING btree (category)` |
| idx_telemetry_logs_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_telemetry_logs_created_at ON public.telemetry_logs USING btree (created_at DESC)` |
| idx_telemetry_logs_severity | btree | severity | não | sim |  | `CREATE INDEX idx_telemetry_logs_severity ON public.telemetry_logs USING btree (severity)` |
| idx_telemetry_logs_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_telemetry_logs_user_id ON public.telemetry_logs USING btree (user_id)` |
| telemetry_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX telemetry_logs_pkey ON public.telemetry_logs USING btree (id)` |


## Policies (RLS)

### `Admins can view all telemetry logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))))` |
| WITH CHECK |  |

### `Strict insert telemetry logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() IS NOT NULL)` |


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

# public.rule_execution_logs

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
| 2 | `rule_id` | `uuid` | sim |  |  |  |
| 3 | `entity_type` | `text` | não |  |  |  |
| 4 | `entity_id` | `uuid` | não |  |  |  |
| 5 | `trigger_event` | `text` | não |  |  |  |
| 6 | `conditions_met` | `boolean` | não |  |  |  |
| 7 | `actions_executed` | `jsonb` | sim |  |  |  |
| 8 | `execution_time_ms` | `integer` | sim |  |  |  |
| 9 | `error_message` | `text` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rule_execution_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| rule_execution_logs_rule_id_fkey | FOREIGN KEY | `FOREIGN KEY (rule_id) REFERENCES business_rules(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_rule_execution_logs_rule_id | btree | rule_id | não | sim |  | `CREATE INDEX idx_rule_execution_logs_rule_id ON public.rule_execution_logs USING btree (rule_id)` |
| rule_execution_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rule_execution_logs_pkey ON public.rule_execution_logs USING btree (id)` |


## Policies (RLS)

### `Authenticated users can view rule logs`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() IS NOT NULL)` |
| WITH CHECK |  |

### `Strict insert rule logs`

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

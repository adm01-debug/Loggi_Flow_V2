# public.business_rules_config

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
| 1 | `key` | `text` | não |  |  |  |
| 2 | `value` | `jsonb` | não |  |  |  |
| 3 | `description` | `text` | sim |  |  |  |
| 4 | `updated_by` | `uuid` | sim |  |  |  |
| 5 | `updated_at` | `timestamp with time zone` | não | `timezone('utc'::text, now())` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| business_rules_config_pkey | PRIMARY KEY | `PRIMARY KEY (key)` |  |  | sim |
| business_rules_config_updated_by_fkey | FOREIGN KEY | `FOREIGN KEY (updated_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| business_rules_config_pkey | btree | key | sim | sim |  | `CREATE UNIQUE INDEX business_rules_config_pkey ON public.business_rules_config USING btree (key)` |
| idx_business_rules_config_updated_by | btree | updated_by | não | sim |  | `CREATE INDEX idx_business_rules_config_updated_by ON public.business_rules_config USING btree (updated_by)` |


## Policies (RLS)

### `Business rules are viewable by all authenticated users`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(auth.role() = 'authenticated'::text)` |
| WITH CHECK |  |

### `Business rules can only be managed by admins`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| audit_log_trigger | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_log_trigger |
| update_business_rules_config_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

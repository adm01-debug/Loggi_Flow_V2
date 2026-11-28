# public.geo_blocking_rules

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
| 2 | `country_code` | `text` | não |  |  |  |
| 3 | `country_name` | `text` | não |  |  |  |
| 4 | `rule_type` | `text` | não |  |  |  |
| 5 | `description` | `text` | sim |  |  |  |
| 6 | `is_active` | `boolean` | não | `true` |  |  |
| 7 | `created_by` | `uuid` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| geo_blocking_rules_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| geo_blocking_rules_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| geo_blocking_rules_rule_type_check | CHECK | `CHECK (rule_type = ANY (ARRAY['allow'::text, 'block'::text]))` |  |  | sim |
| unique_country_rule | UNIQUE | `UNIQUE (country_code)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| geo_blocking_rules_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX geo_blocking_rules_pkey ON public.geo_blocking_rules USING btree (id)` |
| idx_geo_blocking_country_code | btree | country_code | não | sim |  | `CREATE INDEX idx_geo_blocking_country_code ON public.geo_blocking_rules USING btree (country_code)` |
| idx_geo_blocking_is_active | btree | is_active | não | sim |  | `CREATE INDEX idx_geo_blocking_is_active ON public.geo_blocking_rules USING btree (is_active)` |
| idx_geo_blocking_rules_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_geo_blocking_rules_created_by ON public.geo_blocking_rules USING btree (created_by)` |
| unique_country_rule | btree | country_code | sim | sim |  | `CREATE UNIQUE INDEX unique_country_rule ON public.geo_blocking_rules USING btree (country_code)` |


## Policies (RLS)

### `Admins can manage geo blocking rules`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | public |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can view geo rules`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| audit_log_trigger | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_log_trigger |
| update_geo_blocking_rules_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

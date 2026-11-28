# public.geo_access_rules

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
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `country_code` | `character varying(2)` | não |  |  |  |
| 3 | `country_name` | `character varying(100)` | não |  |  |  |
| 4 | `is_active` | `boolean` | não | `true` |  |  |
| 5 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 6 | `created_by` | `uuid` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| geo_access_rules_country_code_key | UNIQUE | `UNIQUE (country_code)` |  |  | sim |
| geo_access_rules_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| geo_access_rules_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| geo_access_rules_country_code_key | btree | country_code | sim | sim |  | `CREATE UNIQUE INDEX geo_access_rules_country_code_key ON public.geo_access_rules USING btree (country_code)` |
| geo_access_rules_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX geo_access_rules_pkey ON public.geo_access_rules USING btree (id)` |
| idx_geo_access_rules_active | btree | is_active | não | sim | `(is_active = true)` | `CREATE INDEX idx_geo_access_rules_active ON public.geo_access_rules USING btree (is_active) WHERE (is_active = true)` |
| idx_geo_access_rules_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_geo_access_rules_created_by ON public.geo_access_rules USING btree (created_by)` |


## Policies (RLS)

### `Admins can manage geo access rules`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |


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

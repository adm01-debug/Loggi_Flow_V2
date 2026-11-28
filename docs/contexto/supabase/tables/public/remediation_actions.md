# public.remediation_actions

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `suggestion_id` | `text` | não |  |  |  |
| 3 | `category` | `text` | não |  |  |  |
| 4 | `severity` | `text` | não |  |  |  |
| 5 | `title` | `text` | não |  |  |  |
| 6 | `detail` | `text` | sim |  |  |  |
| 7 | `recommended_action` | `text` | não |  |  |  |
| 8 | `evidence` | `jsonb` | não | `'{}'::jsonb` |  |  |
| 9 | `status` | `text` | não | `'pending'::text` |  |  |
| 10 | `admin_notes` | `text` | sim |  |  |  |
| 11 | `applied_by` | `uuid` | sim |  |  |  |
| 12 | `applied_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 14 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| remediation_actions_applied_by_fkey | FOREIGN KEY | `FOREIGN KEY (applied_by) REFERENCES auth.users(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| remediation_actions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| remediation_actions_severity_check | CHECK | `CHECK (severity = ANY (ARRAY['critical'::text, 'warning'::text, 'ok'::text]))` |  |  | sim |
| remediation_actions_status_check | CHECK | `CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'resolved'::text, 'ignored'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_remediation_actions_applied_by | btree | applied_by | não | sim |  | `CREATE INDEX idx_remediation_actions_applied_by ON public.remediation_actions USING btree (applied_by)` |
| idx_remediation_status | btree | status, created_at | não | sim |  | `CREATE INDEX idx_remediation_status ON public.remediation_actions USING btree (status, created_at DESC)` |
| idx_remediation_suggestion | btree | suggestion_id | não | sim |  | `CREATE INDEX idx_remediation_suggestion ON public.remediation_actions USING btree (suggestion_id)` |
| remediation_actions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX remediation_actions_pkey ON public.remediation_actions USING btree (id)` |


## Policies (RLS)

### `Admins can delete remediation actions`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can insert remediation actions`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins can update remediation actions`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins can view remediation actions`

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
| trg_remediation_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

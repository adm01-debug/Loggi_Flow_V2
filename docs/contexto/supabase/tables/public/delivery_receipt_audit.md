# public.delivery_receipt_audit

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
| 2 | `delivery_id` | `uuid` | não |  |  |  |
| 3 | `user_id` | `uuid` | sim |  |  |  |
| 4 | `file_name` | `text` | não |  |  |  |
| 5 | `file_size` | `bigint` | sim |  |  |  |
| 6 | `file_type` | `text` | sim |  |  |  |
| 7 | `storage_path` | `text` | não |  |  |  |
| 8 | `upload_status` | `text` | não |  |  |  |
| 9 | `ocr_status` | `text` | sim |  |  |  |
| 10 | `error_message` | `text` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| delivery_receipt_audit_delivery_id_fkey | FOREIGN KEY | `FOREIGN KEY (delivery_id) REFERENCES entregas(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| delivery_receipt_audit_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| delivery_receipt_audit_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| delivery_receipt_audit_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX delivery_receipt_audit_pkey ON public.delivery_receipt_audit USING btree (id)` |
| idx_delivery_receipt_audit_delivery_id | btree | delivery_id | não | sim |  | `CREATE INDEX idx_delivery_receipt_audit_delivery_id ON public.delivery_receipt_audit USING btree (delivery_id)` |
| idx_delivery_receipt_audit_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_delivery_receipt_audit_user_id ON public.delivery_receipt_audit USING btree (user_id)` |


## Policies (RLS)

### `Admins view delivery receipt audit`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `System inserts delivery receipt audit`

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

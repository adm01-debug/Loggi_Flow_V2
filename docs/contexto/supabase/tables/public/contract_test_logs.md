# public.contract_test_logs

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
| 2 | `entity_name` | `text` | não |  |  |  |
| 3 | `payload` | `jsonb` | sim |  |  |  |
| 4 | `is_valid` | `boolean` | não |  |  |  |
| 5 | `errors` | `jsonb` | sim |  |  |  |
| 6 | `latency_ms` | `integer` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `payload_hash` | `text` | sim |  |  | SHA-256 hex do payload validado. O payload bruto não é mais armazenado (LGPD/privacidade). |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| contract_test_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contract_test_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contract_test_logs_pkey ON public.contract_test_logs USING btree (id)` |


## Policies (RLS)

### `Admins insert test logs`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

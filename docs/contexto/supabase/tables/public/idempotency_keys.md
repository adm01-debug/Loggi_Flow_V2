# public.idempotency_keys

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
| 2 | `idempotency_key` | `text` | não |  |  |  |
| 3 | `provider` | `text` | não |  |  |  |
| 4 | `processed_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| idempotency_keys_idempotency_key_key | UNIQUE | `UNIQUE (idempotency_key)` |  |  | sim |
| idempotency_keys_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idempotency_keys_idempotency_key_key | btree | idempotency_key | sim | sim |  | `CREATE UNIQUE INDEX idempotency_keys_idempotency_key_key ON public.idempotency_keys USING btree (idempotency_key)` |
| idempotency_keys_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX idempotency_keys_pkey ON public.idempotency_keys USING btree (id)` |


## Policies (RLS)

### `Admins view idempotency logs`

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


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

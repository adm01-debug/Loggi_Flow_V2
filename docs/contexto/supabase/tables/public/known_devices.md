# public.known_devices

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `device_fingerprint` | `text` | não |  |  |  |
| 4 | `ip_address` | `text` | sim |  |  |  |
| 5 | `browser` | `text` | sim |  |  |  |
| 6 | `os` | `text` | sim |  |  |  |
| 7 | `device_type` | `text` | sim |  |  |  |
| 8 | `location` | `text` | sim |  |  |  |
| 9 | `first_seen_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `last_seen_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `is_trusted` | `boolean` | sim | `false` |  |  |
| 12 | `name` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| known_devices_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| known_devices_user_id_device_fingerprint_key | UNIQUE | `UNIQUE (user_id, device_fingerprint)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_known_devices_fingerprint | btree | device_fingerprint | não | sim |  | `CREATE INDEX idx_known_devices_fingerprint ON public.known_devices USING btree (device_fingerprint)` |
| idx_known_devices_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_known_devices_user_id ON public.known_devices USING btree (user_id)` |
| known_devices_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX known_devices_pkey ON public.known_devices USING btree (id)` |
| known_devices_user_id_device_fingerprint_key | btree | user_id, device_fingerprint | sim | sim |  | `CREATE UNIQUE INDEX known_devices_user_id_device_fingerprint_key ON public.known_devices USING btree (user_id, device_fingerprint)` |


## Policies (RLS)

### `Users can delete their own devices`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can insert their own devices`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update their own devices`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own devices`

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
| update_known_devices_last_seen | BEFORE | UPDATE | ROW | enabled | public.update_device_last_seen |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.rastreamento_historico

| propriedade | valor |
|---|---|
| tipo | partitioned |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| chave de partição | `RANGE (recorded_at)` |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `coleta_id` | `uuid` | sim |  |  |  |
| 3 | `lalamove_order_id` | `text` | não |  |  |  |
| 4 | `driver_id` | `text` | sim |  |  |  |
| 5 | `driver_name` | `text` | sim |  |  |  |
| 6 | `driver_phone` | `text` | sim |  |  |  |
| 7 | `driver_plate` | `text` | sim |  |  |  |
| 8 | `latitude` | `numeric` | não |  |  |  |
| 9 | `longitude` | `numeric` | não |  |  |  |
| 10 | `order_status` | `text` | sim |  |  |  |
| 11 | `recorded_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rastreamento_historico_coleta_id_fkey | FOREIGN KEY | `FOREIGN KEY (coleta_id) REFERENCES coletas(id)` | NO ACTION | NO ACTION | sim |
| rastreamento_historico_pkey | PRIMARY KEY | `PRIMARY KEY (id, recorded_at)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_rastreamento_historico_coleta_id | btree | coleta_id | não | sim |  | `CREATE INDEX idx_rastreamento_historico_coleta_id ON ONLY public.rastreamento_historico USING btree (coleta_id)` |
| idx_rastreamento_historico_created | btree | created_at | não | sim |  | `CREATE INDEX idx_rastreamento_historico_created ON ONLY public.rastreamento_historico USING btree (created_at DESC)` |
| idx_rastreamento_lalamove_order | btree | lalamove_order_id | não | sim |  | `CREATE INDEX idx_rastreamento_lalamove_order ON ONLY public.rastreamento_historico USING btree (lalamove_order_id)` |
| rastreamento_historico_pkey | btree | id, recorded_at | sim | sim |  | `CREATE UNIQUE INDEX rastreamento_historico_pkey ON ONLY public.rastreamento_historico USING btree (id, recorded_at)` |


## Policies (RLS)

### `Admins can view tracking history`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Strict insert tracking data`

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

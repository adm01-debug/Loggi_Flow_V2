# public.rastreamento_historico_y2027m05

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
| partição de | public.rastreamento_historico |
| bound | `FOR VALUES FROM ('2027-05-01 00:00:00+00') TO ('2027-06-01 00:00:00+00')` |


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
| rastreamento_historico_y2027m05_pkey | PRIMARY KEY | `PRIMARY KEY (id, recorded_at)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| rastreamento_historico_y2027m05_coleta_id_idx1 | btree | coleta_id | não | sim |  | `CREATE INDEX rastreamento_historico_y2027m05_coleta_id_idx1 ON public.rastreamento_historico_y2027m05 USING btree (coleta_id)` |
| rastreamento_historico_y2027m05_created_at_idx | btree | created_at | não | sim |  | `CREATE INDEX rastreamento_historico_y2027m05_created_at_idx ON public.rastreamento_historico_y2027m05 USING btree (created_at DESC)` |
| rastreamento_historico_y2027m05_lalamove_order_id_idx | btree | lalamove_order_id | não | sim |  | `CREATE INDEX rastreamento_historico_y2027m05_lalamove_order_id_idx ON public.rastreamento_historico_y2027m05 USING btree (lalamove_order_id)` |
| rastreamento_historico_y2027m05_pkey | btree | id, recorded_at | sim | sim |  | `CREATE UNIQUE INDEX rastreamento_historico_y2027m05_pkey ON public.rastreamento_historico_y2027m05 USING btree (id, recorded_at)` |


## Policies (RLS)

### `Admins can view tracking history y2027m05`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Authenticated can insert tracking data`

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

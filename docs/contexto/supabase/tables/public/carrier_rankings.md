# public.carrier_rankings

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
| 2 | `transportadora_id` | `uuid` | não |  |  |  |
| 3 | `period` | `text` | não |  |  |  |
| 4 | `total_shipments` | `integer` | sim | `0` |  |  |
| 5 | `on_time_shipments` | `integer` | sim | `0` |  |  |
| 6 | `sla_percentage` | `numeric(5,2)` | sim | `0.00` |  |  |
| 7 | `efficiency_score` | `numeric(5,2)` | sim | `0.00` |  |  |
| 8 | `rank_tier` | `text` | sim | `'bronze'::text` |  |  |
| 9 | `last_updated` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| carrier_rankings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| carrier_rankings_transportadora_id_fkey | FOREIGN KEY | `FOREIGN KEY (transportadora_id) REFERENCES transportadoras(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| carrier_rankings_transportadora_id_period_key | UNIQUE | `UNIQUE (transportadora_id, period)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| carrier_rankings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX carrier_rankings_pkey ON public.carrier_rankings USING btree (id)` |
| carrier_rankings_transportadora_id_period_key | btree | transportadora_id, period | sim | sim |  | `CREATE UNIQUE INDEX carrier_rankings_transportadora_id_period_key ON public.carrier_rankings USING btree (transportadora_id, period)` |
| idx_carrier_rankings_transportadora_id | btree | transportadora_id | não | sim |  | `CREATE INDEX idx_carrier_rankings_transportadora_id ON public.carrier_rankings USING btree (transportadora_id)` |


## Policies (RLS)

### `Authenticated view carrier rankings`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

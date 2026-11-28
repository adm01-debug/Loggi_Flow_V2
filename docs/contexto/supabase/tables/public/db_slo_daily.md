# public.db_slo_daily

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
| 2 | `day` | `date` | não |  |  |  |
| 3 | `samples` | `integer` | não |  |  |  |
| 4 | `connection_slo_pct` | `numeric` | não |  |  |  |
| 5 | `cache_slo_pct` | `numeric` | não |  |  |  |
| 6 | `deadlock_free_pct` | `numeric` | não |  |  |  |
| 7 | `overall_slo_pct` | `numeric` | não |  |  |  |
| 8 | `computed_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| db_slo_daily_day_key | UNIQUE | `UNIQUE (day)` |  |  | sim |
| db_slo_daily_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| db_slo_daily_day_key | btree | day | sim | sim |  | `CREATE UNIQUE INDEX db_slo_daily_day_key ON public.db_slo_daily USING btree (day)` |
| db_slo_daily_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX db_slo_daily_pkey ON public.db_slo_daily USING btree (id)` |


## Policies (RLS)

### `Admins can view db slo daily`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

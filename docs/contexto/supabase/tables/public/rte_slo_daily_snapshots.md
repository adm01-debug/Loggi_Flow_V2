# public.rte_slo_daily_snapshots

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
| 2 | `day` | `date` | não |  |  |  |
| 3 | `gateway` | `text` | não |  |  |  |
| 4 | `checks` | `integer` | não | `0` |  |  |
| 5 | `failures` | `integer` | não | `0` |  |  |
| 6 | `uptime_pct` | `numeric(6,2)` | não | `0` |  |  |
| 7 | `avg_latency_ms` | `integer` | não | `0` |  |  |
| 8 | `p95_latency_ms` | `integer` | não | `0` |  |  |
| 9 | `error_budget_used_pct` | `numeric(7,2)` | não | `0` |  |  |
| 10 | `status` | `text` | não | `'ok'::text` |  |  |
| 11 | `uptime_target_pct` | `numeric(6,2)` | não | `99` |  |  |
| 12 | `latency_p95_budget_ms` | `integer` | não | `3000` |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rte_slo_daily_snapshots_day_gateway_key | UNIQUE | `UNIQUE (day, gateway)` |  |  | sim |
| rte_slo_daily_snapshots_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| rte_slo_daily_snapshots_status_check | CHECK | `CHECK (status = ANY (ARRAY['ok'::text, 'atencao'::text, 'violado'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_rte_slo_daily_snapshots_day | btree | day | não | sim |  | `CREATE INDEX idx_rte_slo_daily_snapshots_day ON public.rte_slo_daily_snapshots USING btree (day DESC)` |
| idx_rte_slo_daily_snapshots_gateway_day | btree | gateway, day | não | sim |  | `CREATE INDEX idx_rte_slo_daily_snapshots_gateway_day ON public.rte_slo_daily_snapshots USING btree (gateway, day DESC)` |
| rte_slo_daily_snapshots_day_gateway_key | btree | day, gateway | sim | sim |  | `CREATE UNIQUE INDEX rte_slo_daily_snapshots_day_gateway_key ON public.rte_slo_daily_snapshots USING btree (day, gateway)` |
| rte_slo_daily_snapshots_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rte_slo_daily_snapshots_pkey ON public.rte_slo_daily_snapshots USING btree (id)` |


## Policies (RLS)

### `Admins can delete slo snapshots`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can insert slo snapshots`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins can update slo snapshots`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Authenticated can read slo snapshots`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_rte_slo_daily_snapshots_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

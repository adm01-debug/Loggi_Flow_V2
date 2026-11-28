# public.rte_slo_targets

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
| 2 | `gateway` | `text` | não |  |  |  |
| 3 | `uptime_target_pct` | `numeric(5,2)` | não | `99` |  |  |
| 4 | `latency_p95_budget_ms` | `integer` | não | `2000` |  |  |
| 5 | `updated_by` | `uuid` | sim |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rte_slo_targets_gateway_key | UNIQUE | `UNIQUE (gateway)` |  |  | sim |
| rte_slo_targets_latency_p95_budget_ms_check | CHECK | `CHECK (latency_p95_budget_ms >= 50 AND latency_p95_budget_ms <= 120000)` |  |  | sim |
| rte_slo_targets_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| rte_slo_targets_uptime_target_pct_check | CHECK | `CHECK (uptime_target_pct >= 50::numeric AND uptime_target_pct <= 100::numeric)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| rte_slo_targets_gateway_key | btree | gateway | sim | sim |  | `CREATE UNIQUE INDEX rte_slo_targets_gateway_key ON public.rte_slo_targets USING btree (gateway)` |
| rte_slo_targets_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rte_slo_targets_pkey ON public.rte_slo_targets USING btree (id)` |


## Policies (RLS)

### `Admins podem atualizar metas de SLO`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins podem inserir metas de SLO`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins podem remover metas de SLO`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Autenticados podem ver metas de SLO`

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
| update_rte_slo_targets_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

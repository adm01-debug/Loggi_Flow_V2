# public.rastreamento_alertas

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 5 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `lalamove_order_id` | `text` | não |  |  |  |
| 3 | `coleta_id` | `uuid` | sim |  |  |  |
| 4 | `alert_type` | `text` | não |  |  |  |
| 5 | `severity` | `text` | não |  |  |  |
| 6 | `message` | `text` | não |  |  |  |
| 7 | `latitude` | `numeric` | sim |  |  |  |
| 8 | `longitude` | `numeric` | sim |  |  |  |
| 9 | `resolved` | `boolean` | sim | `false` |  |  |
| 10 | `resolved_at` | `timestamp with time zone` | sim |  |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| rastreamento_alertas_coleta_id_fkey | FOREIGN KEY | `FOREIGN KEY (coleta_id) REFERENCES coletas(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| rastreamento_alertas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_rastreamento_alertas_coleta_id | btree | coleta_id | não | sim |  | `CREATE INDEX idx_rastreamento_alertas_coleta_id ON public.rastreamento_alertas USING btree (coleta_id)` |
| idx_rastreamento_alertas_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_rastreamento_alertas_created_at ON public.rastreamento_alertas USING btree (created_at)` |
| idx_rastreamento_alertas_order | btree | lalamove_order_id | não | sim |  | `CREATE INDEX idx_rastreamento_alertas_order ON public.rastreamento_alertas USING btree (lalamove_order_id)` |
| rastreamento_alertas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX rastreamento_alertas_pkey ON public.rastreamento_alertas USING btree (id)` |


## Policies (RLS)

### `Admins can update rastreamento_alertas`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Authenticated users can insert tracking alerts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() IS NOT NULL)` |

### `Authenticated users can update tracking alerts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() IS NOT NULL)` |
| WITH CHECK |  |

### `Authenticated users can view tracking alerts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() IS NOT NULL)` |
| WITH CHECK |  |

### `Strict insert rastreamento alertas`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() IS NOT NULL)` |


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

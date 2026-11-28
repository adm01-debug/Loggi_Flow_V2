# public.fretes_internos

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 6 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `origem` | `text` | não |  |  |  |
| 3 | `destino` | `text` | não |  |  |  |
| 4 | `motorista` | `text` | sim |  |  |  |
| 5 | `quantidade_itens` | `integer` | não | `1` |  |  |
| 6 | `status` | `frete_interno_status` | não | `'pendente'::frete_interno_status` |  |  |
| 8 | `previsao_entrega` | `timestamp with time zone` | sim |  |  |  |
| 9 | `data_entrega_efetiva` | `timestamp with time zone` | sim |  |  |  |
| 10 | `xp_reward` | `integer` | não | `50` |  |  |
| 11 | `observacoes` | `text` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `organization_id` | `uuid` | sim |  |  |  |
| 16 | `deleted_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| fretes_internos_organization_id_fkey | FOREIGN KEY | `FOREIGN KEY (organization_id) REFERENCES organizations(id)` | NO ACTION | NO ACTION | sim |
| fretes_internos_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| fretes_internos_xp_nonneg | CHECK | `CHECK (xp_reward IS NULL OR xp_reward >= 0)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| fretes_internos_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX fretes_internos_pkey ON public.fretes_internos USING btree (id)` |
| idx_fretes_internos_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_fretes_internos_created_at ON public.fretes_internos USING btree (created_at DESC)` |
| idx_fretes_internos_organization_id | btree | organization_id | não | sim |  | `CREATE INDEX idx_fretes_internos_organization_id ON public.fretes_internos USING btree (organization_id)` |
| idx_fretes_internos_status | btree | status | não | sim |  | `CREATE INDEX idx_fretes_internos_status ON public.fretes_internos USING btree (status)` |
| idx_fretes_internos_status_created | btree | status, created_at | não | sim |  | `CREATE INDEX idx_fretes_internos_status_created ON public.fretes_internos USING btree (status, created_at DESC)` |


## Policies (RLS)

### `Admin delete fretes_internos`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can update fretes_internos`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Authenticated users can insert fretes_internos`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() IS NOT NULL)` |

### `Authenticated users can view fretes_internos`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() IS NOT NULL)` |
| WITH CHECK |  |

### `Users can insert their organization's fretes`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(organization_id = get_current_organization_id())` |

### `Users can view their organization's fretes`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(organization_id = get_current_organization_id())` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| audit_log_trigger | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_log_trigger |
| trigger_notify_frete_interno | AFTER | UPDATE | ROW | enabled | public.notify_frete_interno_concluido |
| update_fretes_internos_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

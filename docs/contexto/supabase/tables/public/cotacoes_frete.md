# public.cotacoes_frete

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
| 2 | `entrega_id` | `uuid` | não |  |  |  |
| 3 | `transportadora_id` | `uuid` | não |  |  |  |
| 4 | `valor` | `numeric(10,2)` | não |  |  |  |
| 5 | `prazo_dias` | `integer` | sim |  |  |  |
| 6 | `selecionada` | `boolean` | sim | `false` |  |  |
| 7 | `observacoes` | `text` | sim |  |  |  |
| 8 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 9 | `version` | `integer` | sim | `1` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cotacoes_frete_entrega_id_fkey | FOREIGN KEY | `FOREIGN KEY (entrega_id) REFERENCES entregas(id)` | NO ACTION | NO ACTION | sim |
| cotacoes_frete_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| cotacoes_frete_transportadora_id_fkey | FOREIGN KEY | `FOREIGN KEY (transportadora_id) REFERENCES transportadoras(id)` | NO ACTION | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cotacoes_frete_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cotacoes_frete_pkey ON public.cotacoes_frete USING btree (id)` |
| idx_cotacoes_frete_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_cotacoes_frete_created_at ON public.cotacoes_frete USING btree (created_at DESC)` |
| idx_cotacoes_frete_entrega_id | btree | entrega_id | não | sim |  | `CREATE INDEX idx_cotacoes_frete_entrega_id ON public.cotacoes_frete USING btree (entrega_id)` |
| idx_cotacoes_frete_transportadora_id | btree | transportadora_id | não | sim |  | `CREATE INDEX idx_cotacoes_frete_transportadora_id ON public.cotacoes_frete USING btree (transportadora_id)` |


## Policies (RLS)

### `Admins can delete cotacoes_frete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can insert cotacoes_frete`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins can update cotacoes_frete`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Auth users can view cotacoes_frete`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() IS NOT NULL)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| audit_log_trigger | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_log_trigger |
| tr_cotacoes_frete_optimistic_locking | BEFORE | UPDATE | ROW | enabled | public.handle_optimistic_locking |
| tr_increment_cotacoes_frete_version | BEFORE | UPDATE | ROW | enabled | public.increment_version_column |
| update_cotacoes_frete_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

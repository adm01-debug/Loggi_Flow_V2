# public.tabelas_frete

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
| 2 | `transportadora_id` | `uuid` | não |  |  |  |
| 3 | `regiao_destino` | `text` | não |  |  |  |
| 4 | `estado_destino` | `text` | não |  |  |  |
| 5 | `peso_min_kg` | `numeric` | não | `0` |  |  |
| 6 | `peso_max_kg` | `numeric` | não | `999999` |  |  |
| 7 | `preco_por_kg` | `numeric` | não |  |  |  |
| 8 | `taxa_fixa` | `numeric` | não | `0` |  |  |
| 9 | `prazo_dias` | `integer` | não | `5` |  |  |
| 10 | `ativo` | `boolean` | não | `true` |  |  |
| 11 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| tabelas_frete_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| tabelas_frete_transportadora_id_fkey | FOREIGN KEY | `FOREIGN KEY (transportadora_id) REFERENCES transportadoras(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_tabelas_frete_estado | btree | estado_destino | não | sim |  | `CREATE INDEX idx_tabelas_frete_estado ON public.tabelas_frete USING btree (estado_destino)` |
| idx_tabelas_frete_peso | btree | peso_min_kg, peso_max_kg | não | sim |  | `CREATE INDEX idx_tabelas_frete_peso ON public.tabelas_frete USING btree (peso_min_kg, peso_max_kg)` |
| idx_tabelas_frete_transportadora_id | btree | transportadora_id | não | sim |  | `CREATE INDEX idx_tabelas_frete_transportadora_id ON public.tabelas_frete USING btree (transportadora_id)` |
| tabelas_frete_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX tabelas_frete_pkey ON public.tabelas_frete USING btree (id)` |


## Policies (RLS)

### `Admins can delete tabelas_frete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can insert tabelas_frete`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins can update tabelas_frete`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Auth users can view tabelas_frete`

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
| update_tabelas_frete_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.transportadora_rotas

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
| 3 | `origem_estado` | `text` | não |  |  |  |
| 4 | `origem_cidade` | `text` | sim |  |  |  |
| 5 | `origem_cep_inicio` | `text` | sim |  |  |  |
| 6 | `origem_cep_fim` | `text` | sim |  |  |  |
| 7 | `destino_estado` | `text` | não |  |  |  |
| 8 | `destino_cidade` | `text` | sim |  |  |  |
| 9 | `destino_cep_inicio` | `text` | sim |  |  |  |
| 10 | `destino_cep_fim` | `text` | sim |  |  |  |
| 11 | `prazo_dias` | `integer` | sim | `5` |  |  |
| 12 | `preco_por_kg` | `numeric` | sim | `0` |  |  |
| 13 | `taxa_fixa` | `numeric` | sim | `0` |  |  |
| 14 | `ativo` | `boolean` | sim | `true` |  |  |
| 15 | `observacoes` | `text` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| transportadora_rotas_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| transportadora_rotas_transportadora_id_fkey | FOREIGN KEY | `FOREIGN KEY (transportadora_id) REFERENCES transportadoras(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_rotas_cep_destino | btree | destino_cep_inicio, destino_cep_fim | não | sim |  | `CREATE INDEX idx_rotas_cep_destino ON public.transportadora_rotas USING btree (destino_cep_inicio, destino_cep_fim)` |
| idx_rotas_cep_origem | btree | origem_cep_inicio, origem_cep_fim | não | sim |  | `CREATE INDEX idx_rotas_cep_origem ON public.transportadora_rotas USING btree (origem_cep_inicio, origem_cep_fim)` |
| idx_rotas_destino | btree | destino_estado, destino_cidade | não | sim |  | `CREATE INDEX idx_rotas_destino ON public.transportadora_rotas USING btree (destino_estado, destino_cidade)` |
| idx_rotas_origem | btree | origem_estado, origem_cidade | não | sim |  | `CREATE INDEX idx_rotas_origem ON public.transportadora_rotas USING btree (origem_estado, origem_cidade)` |
| idx_transportadora_rotas_cep_range | btree | origem_cep_inicio, origem_cep_fim, destino_cep_inicio, destino_cep_fim | não | sim |  | `CREATE INDEX idx_transportadora_rotas_cep_range ON public.transportadora_rotas USING btree (origem_cep_inicio, origem_cep_fim, destino_cep_inicio, destino_cep_fim)` |
| idx_transportadora_rotas_transportadora_id | btree | transportadora_id | não | sim |  | `CREATE INDEX idx_transportadora_rotas_transportadora_id ON public.transportadora_rotas USING btree (transportadora_id)` |
| transportadora_rotas_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX transportadora_rotas_pkey ON public.transportadora_rotas USING btree (id)` |


## Policies (RLS)

### `Admins can delete transportadora_rotas`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can insert transportadora_rotas`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins can update transportadora_rotas`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Auth users can view transportadora_rotas`

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
| update_transportadora_rotas_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

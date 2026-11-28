# public.logistica_reversa

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 3 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `entrega_id` | `uuid` | sim |  |  |  |
| 3 | `cliente_id` | `uuid` | sim |  |  |  |
| 4 | `motivo` | `text` | não |  |  |  |
| 5 | `descricao_detalhada` | `text` | sim |  |  |  |
| 6 | `status` | `text` | não | `'pendente'::text` |  |  |
| 7 | `prioridade` | `text` | sim | `'normal'::text` |  |  |
| 8 | `codigo_rastreio_reverso` | `text` | sim |  |  |  |
| 9 | `valor_estorno` | `numeric(10,2)` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 11 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 12 | `created_by` | `uuid` | sim |  |  |  |
| 13 | `version` | `integer` | sim | `0` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| logistica_reversa_cliente_id_fkey | FOREIGN KEY | `FOREIGN KEY (cliente_id) REFERENCES clientes(id)` | NO ACTION | NO ACTION | sim |
| logistica_reversa_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| logistica_reversa_entrega_id_fkey | FOREIGN KEY | `FOREIGN KEY (entrega_id) REFERENCES entregas(id)` | NO ACTION | NO ACTION | sim |
| logistica_reversa_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_logistica_reversa_cliente_id | btree | cliente_id | não | sim |  | `CREATE INDEX idx_logistica_reversa_cliente_id ON public.logistica_reversa USING btree (cliente_id)` |
| idx_logistica_reversa_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_logistica_reversa_created_by ON public.logistica_reversa USING btree (created_by)` |
| idx_logistica_reversa_entrega_id | btree | entrega_id | não | sim |  | `CREATE INDEX idx_logistica_reversa_entrega_id ON public.logistica_reversa USING btree (entrega_id)` |
| logistica_reversa_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX logistica_reversa_pkey ON public.logistica_reversa USING btree (id)` |
| ux_logistica_reversa_codigo_rastreio | btree | codigo_rastreio_reverso | sim | sim | `(codigo_rastreio_reverso IS NOT NULL)` | `CREATE UNIQUE INDEX ux_logistica_reversa_codigo_rastreio ON public.logistica_reversa USING btree (codigo_rastreio_reverso) WHERE (codigo_rastreio_reverso IS NOT NULL)` |


## Policies (RLS)

### `Apenas admins podem atualizar solicitações`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() IS NOT NULL)` |
| WITH CHECK |  |

### `Logística Reversa visível para todos os usuários autenticado`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() IS NOT NULL)` |
| WITH CHECK |  |

### `Usuários podem inserir solicitações de logística reversa`

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
| trg_increment_logistica_reversa_version | BEFORE | UPDATE | ROW | enabled | public.increment_version |
| update_logistica_reversa_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

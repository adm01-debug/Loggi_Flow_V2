# public.conciliacao_itens_importados

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
| 2 | `conciliacao_id` | `uuid` | não |  |  |  |
| 3 | `linha_arquivo` | `integer` | sim |  |  |  |
| 4 | `referencia_externa` | `character varying(100)` | sim |  |  |  |
| 5 | `descricao` | `text` | sim |  |  |  |
| 6 | `data_documento` | `date` | sim |  |  |  |
| 7 | `valor` | `numeric(12,2)` | não |  |  |  |
| 8 | `transportadora_nome` | `character varying(255)` | sim |  |  |  |
| 9 | `dados_originais` | `jsonb` | sim |  |  |  |
| 10 | `status` | `character varying(30)` | não | `'pendente'::character varying` |  |  |
| 11 | `item_sistema_id` | `uuid` | sim |  |  |  |
| 12 | `diferenca_valor` | `numeric(12,2)` | sim |  |  |  |
| 13 | `observacoes` | `text` | sim |  |  |  |
| 14 | `conciliado_em` | `timestamp with time zone` | sim |  |  |  |
| 15 | `conciliado_por` | `uuid` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| conciliacao_itens_importados_conciliacao_id_fkey | FOREIGN KEY | `FOREIGN KEY (conciliacao_id) REFERENCES conciliacoes(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| conciliacao_itens_importados_conciliado_por_fkey | FOREIGN KEY | `FOREIGN KEY (conciliado_por) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| conciliacao_itens_importados_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| conciliacao_itens_importados_status_check | CHECK | `CHECK (status::text = ANY (ARRAY['pendente'::character varying, 'conciliado'::character varying, 'divergencia'::character varying, 'ignorado'::character varying]::text[]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| conciliacao_itens_importados_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX conciliacao_itens_importados_pkey ON public.conciliacao_itens_importados USING btree (id)` |
| idx_conciliacao_itens_importados_conciliacao_id | btree | conciliacao_id | não | sim |  | `CREATE INDEX idx_conciliacao_itens_importados_conciliacao_id ON public.conciliacao_itens_importados USING btree (conciliacao_id)` |
| idx_conciliacao_itens_importados_conciliado_por | btree | conciliado_por | não | sim |  | `CREATE INDEX idx_conciliacao_itens_importados_conciliado_por ON public.conciliacao_itens_importados USING btree (conciliado_por)` |
| idx_conciliacao_itens_referencia | btree | referencia_externa | não | sim |  | `CREATE INDEX idx_conciliacao_itens_referencia ON public.conciliacao_itens_importados USING btree (referencia_externa)` |
| idx_conciliacao_itens_status | btree | status | não | sim |  | `CREATE INDEX idx_conciliacao_itens_status ON public.conciliacao_itens_importados USING btree (status)` |


## Policies (RLS)

### `Admins can delete conciliacao_itens`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can insert conciliacao_itens`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins can update conciliacao_itens`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins can view conciliacao_itens`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |


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

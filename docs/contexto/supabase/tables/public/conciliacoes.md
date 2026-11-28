# public.conciliacoes

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
| 2 | `tipo` | `character varying(50)` | não |  |  |  |
| 3 | `nome` | `character varying(255)` | não |  |  |  |
| 4 | `descricao` | `text` | sim |  |  |  |
| 5 | `periodo_inicio` | `date` | sim |  |  |  |
| 6 | `periodo_fim` | `date` | sim |  |  |  |
| 7 | `status` | `character varying(30)` | não | `'rascunho'::character varying` |  |  |
| 8 | `total_itens_importados` | `integer` | não | `0` |  |  |
| 9 | `total_itens_conciliados` | `integer` | não | `0` |  |  |
| 10 | `total_divergencias` | `integer` | não | `0` |  |  |
| 11 | `valor_total_importado` | `numeric(12,2)` | sim | `0` |  |  |
| 12 | `valor_total_sistema` | `numeric(12,2)` | sim | `0` |  |  |
| 13 | `diferenca_total` | `numeric(12,2)` | sim | `0` |  |  |
| 14 | `created_by` | `uuid` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| conciliacoes_created_by_fkey | FOREIGN KEY | `FOREIGN KEY (created_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| conciliacoes_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| conciliacoes_status_check | CHECK | `CHECK (status::text = ANY (ARRAY['rascunho'::character varying, 'em_andamento'::character varying, 'concluida'::character varying, 'arquivada'::character varying]::text[]))` |  |  | sim |
| conciliacoes_tipo_check | CHECK | `CHECK (tipo::text = ANY (ARRAY['faturas_entregas'::character varying, 'custos_previstos_realizados'::character varying, 'pagamentos_notas'::character varying]::text[]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.conciliacao_itens_importados | conciliacao_itens_importados_conciliacao_id_fkey | conciliacao_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| conciliacoes_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX conciliacoes_pkey ON public.conciliacoes USING btree (id)` |
| idx_conciliacoes_created_by | btree | created_by | não | sim |  | `CREATE INDEX idx_conciliacoes_created_by ON public.conciliacoes USING btree (created_by)` |
| idx_conciliacoes_status | btree | status | não | sim |  | `CREATE INDEX idx_conciliacoes_status ON public.conciliacoes USING btree (status)` |
| idx_conciliacoes_tipo | btree | tipo | não | sim |  | `CREATE INDEX idx_conciliacoes_tipo ON public.conciliacoes USING btree (tipo)` |


## Policies (RLS)

### `Admin delete conciliacoes`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admin or creator can view conciliacoes`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Admins can insert conciliacoes`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins can update conciliacoes`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| audit_log_trigger | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_log_trigger |
| update_conciliacoes_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

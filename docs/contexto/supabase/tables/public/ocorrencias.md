# public.ocorrencias

> Incident reports for pickups and deliveries

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
| 2 | `entrega_id` | `uuid` | sim |  |  |  |
| 3 | `coleta_id` | `uuid` | sim |  |  |  |
| 4 | `tipo_ocorrencia` | `text` | não |  |  |  |
| 5 | `descricao` | `text` | sim |  |  |  |
| 6 | `fotos_urls` | `text[]` | sim | `'{}'::text[]` |  |  |
| 7 | `acao_tomada` | `text` | sim |  |  |  |
| 8 | `resolvida` | `boolean` | sim | `false` |  |  |
| 9 | `data_resolucao` | `timestamp with time zone` | sim |  |  |  |
| 10 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ocorrencias_coleta_id_fkey | FOREIGN KEY | `FOREIGN KEY (coleta_id) REFERENCES coletas(id)` | NO ACTION | NO ACTION | sim |
| ocorrencias_entrega_id_fkey | FOREIGN KEY | `FOREIGN KEY (entrega_id) REFERENCES entregas(id)` | NO ACTION | NO ACTION | sim |
| ocorrencias_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_ocorrencias_coleta_id | btree | coleta_id | não | sim |  | `CREATE INDEX idx_ocorrencias_coleta_id ON public.ocorrencias USING btree (coleta_id)` |
| idx_ocorrencias_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_ocorrencias_created_at ON public.ocorrencias USING btree (created_at DESC)` |
| idx_ocorrencias_entrega_id | btree | entrega_id, created_at | não | sim |  | `CREATE INDEX idx_ocorrencias_entrega_id ON public.ocorrencias USING btree (entrega_id, created_at DESC)` |
| idx_ocorrencias_resolvida | btree | resolvida | não | sim |  | `CREATE INDEX idx_ocorrencias_resolvida ON public.ocorrencias USING btree (resolvida)` |
| ocorrencias_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX ocorrencias_pkey ON public.ocorrencias USING btree (id)` |


## Policies (RLS)

### `Admin delete ocorrencias`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can update ocorrencias`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Insert ocorrencias`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() IS NOT NULL)` |

### `View ocorrencias`

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
| trigger_notify_ocorrencia | AFTER | INSERT | ROW | enabled | public.notify_ocorrencia_registrada |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

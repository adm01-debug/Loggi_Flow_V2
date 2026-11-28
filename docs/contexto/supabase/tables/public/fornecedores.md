# public.fornecedores

> Supplier records for pickups

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
| 2 | `razao_social` | `text` | não |  |  |  |
| 3 | `cnpj` | `text` | sim |  |  |  |
| 4 | `nome_fantasia` | `text` | sim |  |  |  |
| 5 | `endereco_completo` | `text` | não |  |  |  |
| 6 | `cidade` | `text` | sim |  |  |  |
| 7 | `estado` | `text` | sim |  |  |  |
| 8 | `cep` | `text` | sim |  |  |  |
| 9 | `contato_nome` | `text` | sim |  |  |  |
| 10 | `contato_telefone` | `text` | sim |  |  |  |
| 11 | `contato_email` | `text` | sim |  |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 13 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `deleted_at` | `timestamp with time zone` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| fornecedores_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.coletas | fk_coletas_fornecedor | fornecedor_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| fornecedores_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX fornecedores_pkey ON public.fornecedores USING btree (id)` |
| idx_fornecedores_cnpj | btree | cnpj | não | sim |  | `CREATE INDEX idx_fornecedores_cnpj ON public.fornecedores USING btree (cnpj)` |
| idx_fornecedores_deleted_at | btree | deleted_at | não | sim | `(deleted_at IS NULL)` | `CREATE INDEX idx_fornecedores_deleted_at ON public.fornecedores USING btree (deleted_at) WHERE (deleted_at IS NULL)` |


## Policies (RLS)

### `Admins can delete fornecedores`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can insert fornecedores`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins can update fornecedores`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Authenticated users can view fornecedores`

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
| audit_log_trigger | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_log_trigger |
| update_fornecedores_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

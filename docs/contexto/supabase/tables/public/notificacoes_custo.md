# public.notificacoes_custo

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 2 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `alerta_id` | `uuid` | sim |  |  |  |
| 3 | `tipo_notificacao` | `text` | não |  |  |  |
| 4 | `mensagem` | `text` | não |  |  |  |
| 5 | `valor_atual` | `numeric` | não |  |  |  |
| 6 | `limite` | `numeric` | não |  |  |  |
| 7 | `percentual_atingido` | `numeric` | não |  |  |  |
| 8 | `lida` | `boolean` | não | `false` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| notificacoes_custo_alerta_id_fkey | FOREIGN KEY | `FOREIGN KEY (alerta_id) REFERENCES alertas_custo(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| notificacoes_custo_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| notificacoes_custo_tipo_notificacao_check | CHECK | `CHECK (tipo_notificacao = ANY (ARRAY['warning'::text, 'critical'::text, 'exceeded'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_notificacoes_custo_alerta_id | btree | alerta_id | não | sim |  | `CREATE INDEX idx_notificacoes_custo_alerta_id ON public.notificacoes_custo USING btree (alerta_id)` |
| notificacoes_custo_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX notificacoes_custo_pkey ON public.notificacoes_custo USING btree (id)` |


## Policies (RLS)

### `Admins can insert notificacoes_custo`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins can view notificacoes_custo`

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

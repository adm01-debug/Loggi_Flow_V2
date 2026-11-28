# public.cotacoes_multicanal

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `transportadora_id` | `uuid` | não |  |  |  |
| 4 | `canal` | `text` | não |  |  |  |
| 5 | `status` | `text` | não | `'pendente'::text` |  |  |
| 6 | `origem_estado` | `text` | não |  |  |  |
| 7 | `origem_cidade` | `text` | sim |  |  |  |
| 8 | `destino_estado` | `text` | não |  |  |  |
| 9 | `destino_cidade` | `text` | sim |  |  |  |
| 10 | `peso_kg` | `numeric` | sim |  |  |  |
| 11 | `volumes` | `integer` | sim | `1` |  |  |
| 12 | `valor_mercadoria` | `numeric` | sim |  |  |  |
| 13 | `valor_cotado` | `numeric` | sim |  |  |  |
| 14 | `prazo_dias` | `integer` | sim |  |  |  |
| 15 | `observacoes` | `text` | sim |  |  |  |
| 16 | `expires_at` | `timestamp with time zone` | não | `(now() + '24:00:00'::interval)` |  |  |
| 17 | `responded_at` | `timestamp with time zone` | sim |  |  |  |
| 18 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 19 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 20 | `version` | `integer` | sim | `0` |  |  |
| 21 | `workflow_logs` | `jsonb` | sim | `'[]'::jsonb` |  |  |
| 22 | `retry_count` | `integer` | sim | `0` |  |  |
| 23 | `normalization_data` | `jsonb` | sim | `'{}'::jsonb` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| cotacoes_multicanal_canal_check | CHECK | `CHECK (canal = ANY (ARRAY['api'::text, 'whatsapp'::text, 'email'::text]))` |  |  | sim |
| cotacoes_multicanal_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| cotacoes_multicanal_status_check | CHECK | `CHECK (status = ANY (ARRAY['pendente'::text, 'respondido'::text, 'expirado'::text, 'selecionado'::text]))` |  |  | sim |
| cotacoes_multicanal_transportadora_id_fkey | FOREIGN KEY | `FOREIGN KEY (transportadora_id) REFERENCES transportadoras(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| cotacoes_multicanal_valor_nonneg | CHECK | `CHECK (valor_cotado IS NULL OR valor_cotado >= 0::numeric)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| cotacoes_multicanal_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX cotacoes_multicanal_pkey ON public.cotacoes_multicanal USING btree (id)` |
| idx_cotacoes_multi_created | btree | created_at | não | sim |  | `CREATE INDEX idx_cotacoes_multi_created ON public.cotacoes_multicanal USING btree (created_at DESC)` |
| idx_cotacoes_multi_status | btree | status | não | sim |  | `CREATE INDEX idx_cotacoes_multi_status ON public.cotacoes_multicanal USING btree (status)` |
| idx_cotacoes_multicanal_transp_valor | btree | transportadora_id, valor_cotado | não | sim |  | `CREATE INDEX idx_cotacoes_multicanal_transp_valor ON public.cotacoes_multicanal USING btree (transportadora_id, valor_cotado)` |
| idx_cotacoes_multicanal_transportadora_id | btree | transportadora_id | não | sim |  | `CREATE INDEX idx_cotacoes_multicanal_transportadora_id ON public.cotacoes_multicanal USING btree (transportadora_id)` |
| idx_cotacoes_multicanal_user_status | btree | user_id, status | não | sim |  | `CREATE INDEX idx_cotacoes_multicanal_user_status ON public.cotacoes_multicanal USING btree (user_id, status)` |


## Policies (RLS)

### `Admins can delete cotacoes_multicanal`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Users can insert own cotacoes_multicanal`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(user_id = auth.uid())` |

### `Users can update own cotacoes_multicanal`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |

### `Users can view own cotacoes_multicanal`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| audit_log_trigger | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_log_trigger |
| trigger_increment_version_cotacoes | BEFORE | UPDATE | ROW | enabled | public.increment_version_column |
| update_cotacoes_multicanal_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

# public.mitigation_actions

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `category` | `text` | não |  |  |  |
| 4 | `headline` | `text` | não |  |  |  |
| 5 | `priority` | `text` | não |  |  |  |
| 6 | `focus_carrier` | `text` | sim |  |  |  |
| 7 | `impact_score` | `integer` | não | `0` |  |  |
| 8 | `actions` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 9 | `status` | `text` | não | `'planejada'::text` |  |  |
| 10 | `otif_before` | `numeric(5,2)` | sim |  |  |  |
| 11 | `otif_after` | `numeric(5,2)` | sim |  |  |  |
| 12 | `otif_delta` | `numeric(6,2)` | sim | `(COALESCE(otif_after, (0)::numeric) - COALESCE(otif_before, (0)::numeric))` | s |  |
| 13 | `notes` | `text` | sim |  |  |  |
| 14 | `executed_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `measured_at` | `timestamp with time zone` | sim |  |  |  |
| 16 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 17 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| mitigation_actions_category_check | CHECK | `CHECK (category = ANY (ARRAY['clima'::text, 'transportadora'::text, 'distancia'::text, 'feriado'::text, 'demanda'::text, 'endereco'::text, 'documentacao'::text, 'outros'::text]))` |  |  | sim |
| mitigation_actions_impact_score_check | CHECK | `CHECK (impact_score >= 0 AND impact_score <= 100)` |  |  | sim |
| mitigation_actions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| mitigation_actions_priority_check | CHECK | `CHECK (priority = ANY (ARRAY['alta'::text, 'media'::text, 'baixa'::text]))` |  |  | sim |
| mitigation_actions_status_check | CHECK | `CHECK (status = ANY (ARRAY['planejada'::text, 'em_execucao'::text, 'concluida'::text, 'cancelada'::text]))` |  |  | sim |
| mitigation_actions_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_mitigation_actions_category | btree | category | não | sim |  | `CREATE INDEX idx_mitigation_actions_category ON public.mitigation_actions USING btree (category)` |
| idx_mitigation_actions_executed_at | btree | executed_at | não | sim |  | `CREATE INDEX idx_mitigation_actions_executed_at ON public.mitigation_actions USING btree (executed_at DESC)` |
| idx_mitigation_actions_status | btree | status | não | sim |  | `CREATE INDEX idx_mitigation_actions_status ON public.mitigation_actions USING btree (status)` |
| idx_mitigation_actions_user | btree | user_id | não | sim |  | `CREATE INDEX idx_mitigation_actions_user ON public.mitigation_actions USING btree (user_id)` |
| mitigation_actions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX mitigation_actions_pkey ON public.mitigation_actions USING btree (id)` |


## Policies (RLS)

### `Users manage own mitigations`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))` |
| WITH CHECK | `((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_mitigation_actions_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

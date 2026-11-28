# public.ai_delay_predictions

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
| 2 | `entity_id` | `uuid` | não |  |  |  |
| 3 | `entity_type` | `text` | não |  |  |  |
| 4 | `prediction_data` | `jsonb` | não |  |  |  |
| 5 | `risco` | `text` | não |  |  |  |
| 6 | `probabilidade_atraso` | `integer` | não |  |  |  |
| 7 | `analyzed_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 8 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ai_delay_predictions_entity_type_check | CHECK | `CHECK (entity_type = ANY (ARRAY['entrega'::text, 'coleta'::text]))` |  |  | sim |
| ai_delay_predictions_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| ai_delay_predictions_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX ai_delay_predictions_pkey ON public.ai_delay_predictions USING btree (id)` |
| idx_ai_delay_predictions_analyzed | btree | analyzed_at | não | sim |  | `CREATE INDEX idx_ai_delay_predictions_analyzed ON public.ai_delay_predictions USING btree (analyzed_at)` |
| idx_ai_delay_predictions_entity | btree | entity_id | não | sim |  | `CREATE INDEX idx_ai_delay_predictions_entity ON public.ai_delay_predictions USING btree (entity_id)` |


## Policies (RLS)

### `Admins can manage AI delay predictions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(EXISTS ( SELECT 1    FROM user_roles   WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = 'admin'::app_role))))` |
| WITH CHECK |  |

### `Users can view AI delay predictions`

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


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

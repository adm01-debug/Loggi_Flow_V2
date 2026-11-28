# public.delay_predictions_history

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
| usada por views | public.v_prediction_accuracy, public.v_prediction_accuracy_by_carrier, public.v_prediction_accuracy_daily, public.v_prediction_accuracy_daily_carrier |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `entity_id` | `uuid` | não |  |  |  |
| 3 | `entity_type` | `text` | não |  |  |  |
| 4 | `entity_numero` | `text` | sim |  |  |  |
| 5 | `risco` | `text` | não |  |  |  |
| 6 | `probabilidade_atraso` | `integer` | não |  |  |  |
| 7 | `horas_estimadas_atraso` | `numeric(6,2)` | não | `0` |  |  |
| 8 | `motivos` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 9 | `recomendacoes` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 10 | `fatores` | `jsonb` | não | `'[]'::jsonb` |  |  |
| 11 | `predicted_at` | `timestamp with time zone` | não | `now()` |  |  |
| 12 | `confirmed_at` | `timestamp with time zone` | sim |  |  |  |
| 13 | `was_accurate` | `boolean` | sim |  |  |  |
| 14 | `actual_delay_hours` | `numeric(6,2)` | sim |  |  |  |
| 15 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 16 | `transportadora` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| delay_predictions_history_entity_type_check | CHECK | `CHECK (entity_type = ANY (ARRAY['entrega'::text, 'coleta'::text]))` |  |  | sim |
| delay_predictions_history_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| delay_predictions_history_probabilidade_atraso_check | CHECK | `CHECK (probabilidade_atraso >= 0 AND probabilidade_atraso <= 100)` |  |  | sim |
| delay_predictions_history_risco_check | CHECK | `CHECK (risco = ANY (ARRAY['baixo'::text, 'medio'::text, 'alto'::text, 'critico'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| delay_predictions_history_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX delay_predictions_history_pkey ON public.delay_predictions_history USING btree (id)` |
| idx_delay_pred_hist_transp | btree | transportadora, predicted_at | não | sim |  | `CREATE INDEX idx_delay_pred_hist_transp ON public.delay_predictions_history USING btree (transportadora, predicted_at DESC)` |
| idx_dph_entity | btree | entity_id, predicted_at | não | sim |  | `CREATE INDEX idx_dph_entity ON public.delay_predictions_history USING btree (entity_id, predicted_at DESC)` |
| idx_dph_predicted_at | btree | predicted_at | não | sim |  | `CREATE INDEX idx_dph_predicted_at ON public.delay_predictions_history USING btree (predicted_at DESC)` |
| idx_dph_risco | btree | risco | não | sim |  | `CREATE INDEX idx_dph_risco ON public.delay_predictions_history USING btree (risco)` |
| idx_dph_unconfirmed | btree | entity_id | não | sim | `(confirmed_at IS NULL)` | `CREATE INDEX idx_dph_unconfirmed ON public.delay_predictions_history USING btree (entity_id) WHERE (confirmed_at IS NULL)` |


## Policies (RLS)

### `admin_full_access_predictions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `authenticated_read_all_predictions`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |

### `service_role_all_predictions`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

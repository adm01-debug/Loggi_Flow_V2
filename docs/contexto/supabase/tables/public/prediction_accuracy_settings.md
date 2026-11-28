# public.prediction_accuracy_settings

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
| 3 | `transportadora` | `text` | sim |  |  |  |
| 4 | `target_pct` | `numeric` | não | `80` |  |  |
| 5 | `consecutive_days_alert` | `integer` | não | `3` |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 8 | `notify_email` | `boolean` | não | `false` |  |  |
| 9 | `notify_whatsapp` | `boolean` | não | `false` |  |  |
| 10 | `email` | `text` | sim |  |  |  |
| 11 | `whatsapp_phone` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| prediction_accuracy_settings_consecutive_days_alert_check | CHECK | `CHECK (consecutive_days_alert >= 1 AND consecutive_days_alert <= 30)` |  |  | sim |
| prediction_accuracy_settings_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| prediction_accuracy_settings_target_pct_check | CHECK | `CHECK (target_pct >= 0::numeric AND target_pct <= 100::numeric)` |  |  | sim |
| prediction_accuracy_settings_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| prediction_accuracy_settings_user_id_transportadora_key | UNIQUE | `UNIQUE (user_id, transportadora)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| prediction_accuracy_settings_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX prediction_accuracy_settings_pkey ON public.prediction_accuracy_settings USING btree (id)` |
| prediction_accuracy_settings_user_id_transportadora_key | btree | user_id, transportadora | sim | sim |  | `CREATE UNIQUE INDEX prediction_accuracy_settings_user_id_transportadora_key ON public.prediction_accuracy_settings USING btree (user_id, transportadora)` |


## Policies (RLS)

### `Users manage own accuracy settings`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK | `(auth.uid() = user_id)` |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| update_prediction_accuracy_settings_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

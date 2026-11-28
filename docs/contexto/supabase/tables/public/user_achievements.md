# public.user_achievements

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
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `achievement_id` | `uuid` | não |  |  |  |
| 4 | `unlocked_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_achievements_achievement_id_fkey | FOREIGN KEY | `FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_achievements_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_achievements_user_id_achievement_id_key | UNIQUE | `UNIQUE (user_id, achievement_id)` |  |  | sim |
| user_achievements_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_achievements_achievement_id | btree | achievement_id | não | sim |  | `CREATE INDEX idx_user_achievements_achievement_id ON public.user_achievements USING btree (achievement_id)` |
| idx_user_achievements_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_user_achievements_user_id ON public.user_achievements USING btree (user_id)` |
| user_achievements_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_achievements_pkey ON public.user_achievements USING btree (id)` |
| user_achievements_user_id_achievement_id_key | btree | user_id, achievement_id | sim | sim |  | `CREATE UNIQUE INDEX user_achievements_user_id_achievement_id_key ON public.user_achievements USING btree (user_id, achievement_id)` |


## Policies (RLS)

### `Strict insert user achievements`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() IS NOT NULL)` |

### `Users can view their achievements`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| audit_log_trigger | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_log_trigger |
| trigger_notify_conquista | AFTER | INSERT | ROW | enabled | public.notify_conquista_desbloqueada |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

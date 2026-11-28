# public.user_levels

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
| 3 | `current_xp` | `integer` | não | `0` |  |  |
| 4 | `total_xp` | `integer` | não | `0` |  |  |
| 5 | `level` | `integer` | não | `1` |  |  |
| 6 | `coins` | `integer` | não | `0` |  |  |
| 7 | `streak_days` | `integer` | não | `0` |  |  |
| 8 | `last_activity_date` | `date` | sim |  |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 10 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 11 | `rank_id` | `uuid` | sim |  |  |  |
| 12 | `nexus_score` | `numeric(5,2)` | sim | `0` |  | Core Nexus Score (0-100): logistics performance composite metric used by useGamification hook |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_levels_coins_nonneg | CHECK | `CHECK (coins >= 0)` |  |  | sim |
| user_levels_level_min | CHECK | `CHECK (level >= 1)` |  |  | sim |
| user_levels_nexus_score_check | CHECK | `CHECK (nexus_score >= 0::numeric AND nexus_score <= 100::numeric)` |  |  | sim |
| user_levels_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| user_levels_rank_id_fkey | FOREIGN KEY | `FOREIGN KEY (rank_id) REFERENCES user_ranks(id)` | NO ACTION | NO ACTION | sim |
| user_levels_total_xp_nonneg | CHECK | `CHECK (total_xp >= 0)` |  |  | sim |
| user_levels_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| user_levels_user_id_key | UNIQUE | `UNIQUE (user_id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_user_levels_rank_id | btree | rank_id | não | sim |  | `CREATE INDEX idx_user_levels_rank_id ON public.user_levels USING btree (rank_id)` |
| idx_user_levels_total_xp | btree | total_xp | não | sim |  | `CREATE INDEX idx_user_levels_total_xp ON public.user_levels USING btree (total_xp DESC)` |
| idx_user_levels_total_xp_desc | btree | total_xp | não | sim | `(total_xp > 0)` | `CREATE INDEX idx_user_levels_total_xp_desc ON public.user_levels USING btree (total_xp DESC) WHERE (total_xp > 0)` |
| user_levels_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_levels_pkey ON public.user_levels USING btree (id)` |
| user_levels_user_id_key | btree | user_id | sim | sim |  | `CREATE UNIQUE INDEX user_levels_user_id_key ON public.user_levels USING btree (user_id)` |


## Policies (RLS)

### `Strict insert user levels`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() IS NOT NULL)` |

### `Users can view their own level`

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
| on_user_level_up | AFTER | UPDATE | ROW | enabled | public.update_user_rank |
| update_user_levels_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

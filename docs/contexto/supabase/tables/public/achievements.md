# public.achievements

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
| 2 | `code` | `text` | não |  |  |  |
| 3 | `name` | `text` | não |  |  |  |
| 4 | `description` | `text` | não |  |  |  |
| 5 | `icon` | `text` | não | `'Trophy'::text` |  |  |
| 6 | `category` | `text` | não | `'general'::text` |  |  |
| 7 | `rarity` | `text` | não | `'common'::text` |  |  |
| 8 | `xp_reward` | `integer` | não | `50` |  |  |
| 9 | `coins_reward` | `integer` | não | `10` |  |  |
| 10 | `requirement_type` | `text` | não |  |  |  |
| 11 | `requirement_value` | `integer` | não | `1` |  |  |
| 12 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| achievements_code_key | UNIQUE | `UNIQUE (code)` |  |  | sim |
| achievements_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| achievements_rarity_check | CHECK | `CHECK (rarity = ANY (ARRAY['common'::text, 'rare'::text, 'epic'::text, 'legendary'::text]))` |  |  | sim |
| achievements_rewards_nonneg | CHECK | `CHECK (xp_reward >= 0 AND coins_reward >= 0)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.user_achievements | user_achievements_achievement_id_fkey | achievement_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| achievements_code_key | btree | code | sim | sim |  | `CREATE UNIQUE INDEX achievements_code_key ON public.achievements USING btree (code)` |
| achievements_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX achievements_pkey ON public.achievements USING btree (id)` |


## Policies (RLS)

### `Admins can manage achievements`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Anyone can view achievements`

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


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

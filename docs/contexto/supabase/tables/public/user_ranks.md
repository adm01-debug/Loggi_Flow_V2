# public.user_ranks

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
| 2 | `name` | `text` | não |  |  |  |
| 3 | `min_level` | `integer` | não |  |  |  |
| 4 | `icon` | `text` | não |  |  |  |
| 5 | `color` | `text` | não |  |  |  |
| 6 | `reward_multiplier` | `numeric` | sim | `1.0` |  |  |
| 7 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| user_ranks_min_level_key | UNIQUE | `UNIQUE (min_level)` |  |  | sim |
| user_ranks_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| public.user_levels | user_levels_rank_id_fkey | rank_id | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| user_ranks_min_level_key | btree | min_level | sim | sim |  | `CREATE UNIQUE INDEX user_ranks_min_level_key ON public.user_ranks USING btree (min_level)` |
| user_ranks_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX user_ranks_pkey ON public.user_ranks USING btree (id)` |


## Policies (RLS)

### `Ranks visíveis a usuários autenticados`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `true` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

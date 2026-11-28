# public.reward_purchases

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 4 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `user_id` | `uuid` | não |  |  |  |
| 3 | `reward_item_id` | `uuid` | não |  |  |  |
| 4 | `coins_spent` | `integer` | não |  |  |  |
| 5 | `status` | `text` | não | `'pending'::text` |  |  |
| 6 | `redeemed_at` | `timestamp with time zone` | sim |  |  |  |
| 7 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| reward_purchases_coins_nonneg | CHECK | `CHECK (coins_spent >= 0)` |  |  | sim |
| reward_purchases_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| reward_purchases_reward_item_id_fkey | FOREIGN KEY | `FOREIGN KEY (reward_item_id) REFERENCES reward_items(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_reward_purchases_reward_item_id | btree | reward_item_id | não | sim |  | `CREATE INDEX idx_reward_purchases_reward_item_id ON public.reward_purchases USING btree (reward_item_id)` |
| idx_reward_purchases_user_created | btree | user_id, created_at | não | sim |  | `CREATE INDEX idx_reward_purchases_user_created ON public.reward_purchases USING btree (user_id, created_at DESC)` |
| reward_purchases_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX reward_purchases_pkey ON public.reward_purchases USING btree (id)` |


## Policies (RLS)

### `Admins podem atualizar compras`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins podem ver todas compras`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Usuários podem criar compras`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Usuários podem ver suas compras`

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


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

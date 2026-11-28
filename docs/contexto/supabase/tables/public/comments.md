# public.comments

> Comentários em entidades (ocorrências, coletas, entregas, etc)

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
| 2 | `content` | `text` | não |  |  |  |
| 3 | `entity_type` | `text` | não |  |  |  |
| 4 | `entity_id` | `uuid` | não |  |  |  |
| 5 | `user_id` | `uuid` | não |  |  |  |
| 6 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 7 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| comments_entity_type_check | CHECK | `CHECK (entity_type = ANY (ARRAY['ocorrencia'::text, 'coleta'::text, 'entrega'::text, 'frete_interno'::text]))` |  |  | sim |
| comments_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| comments_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| comments_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX comments_pkey ON public.comments USING btree (id)` |
| idx_comments_created | btree | created_at | não | sim |  | `CREATE INDEX idx_comments_created ON public.comments USING btree (created_at DESC)` |
| idx_comments_entity | btree | entity_type, entity_id | não | sim |  | `CREATE INDEX idx_comments_entity ON public.comments USING btree (entity_type, entity_id)` |
| idx_comments_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_comments_user_id ON public.comments USING btree (user_id)` |


## Policies (RLS)

### `Users can create their own comments`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can delete their own comments`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can update their own comments`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view all comments`

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
| trigger_comments_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_comments_updated_at |
| update_comments_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

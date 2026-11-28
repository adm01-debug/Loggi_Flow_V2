# public.system_integrity_logs

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
| 2 | `action_type` | `text` | não |  |  |  |
| 3 | `description` | `text` | não |  |  |  |
| 4 | `entity_affected` | `text` | sim |  |  |  |
| 5 | `severity` | `text` | não |  |  |  |
| 6 | `success` | `boolean` | não | `true` |  |  |
| 7 | `error_message` | `text` | sim |  |  |  |
| 8 | `metadata` | `jsonb` | sim | `'{}'::jsonb` |  |  |
| 9 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| system_integrity_logs_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| system_integrity_logs_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX system_integrity_logs_pkey ON public.system_integrity_logs USING btree (id)` |


## Policies (RLS)

### `Admins can manage system logs`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() IN ( SELECT profiles.id    FROM profiles   WHERE ((profiles.cargo = 'admin'::text) OR (profiles.cargo = 'gestor'::text))))` |
| WITH CHECK |  |


## Triggers

_nenhum_


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

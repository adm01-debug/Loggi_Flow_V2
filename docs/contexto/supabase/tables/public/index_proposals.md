# public.index_proposals

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


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `queryid` | `bigint` | sim |  |  |  |
| 3 | `target_table` | `text` | sim |  |  |  |
| 4 | `target_columns` | `text[]` | sim |  |  |  |
| 5 | `ddl` | `text` | não |  |  |  |
| 6 | `rationale` | `text` | sim |  |  |  |
| 7 | `confidence` | `text` | não | `'medium'::text` |  |  |
| 8 | `status` | `text` | não | `'proposed'::text` |  |  |
| 9 | `proposed_by` | `uuid` | sim |  |  |  |
| 10 | `applied_by` | `uuid` | sim |  |  |  |
| 11 | `applied_at` | `timestamp with time zone` | sim |  |  |  |
| 12 | `error_message` | `text` | sim |  |  |  |
| 13 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 14 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 15 | `baseline_mean_ms` | `double precision` | sim |  |  |  |
| 16 | `post_apply_mean_ms` | `double precision` | sim |  |  |  |
| 17 | `improvement_pct` | `numeric` | sim |  |  |  |
| 18 | `measured_at` | `timestamp with time zone` | sim |  |  |  |
| 19 | `reverted_at` | `timestamp with time zone` | sim |  |  |  |
| 20 | `revert_reason` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| index_proposals_applied_by_fkey | FOREIGN KEY | `FOREIGN KEY (applied_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| index_proposals_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| index_proposals_proposed_by_fkey | FOREIGN KEY | `FOREIGN KEY (proposed_by) REFERENCES auth.users(id)` | NO ACTION | NO ACTION | sim |
| index_proposals_status_check | CHECK | `CHECK (status = ANY (ARRAY['proposed'::text, 'approved'::text, 'applied'::text, 'rejected'::text, 'failed'::text, 'reverted'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_index_proposals_applied_by | btree | applied_by | não | sim |  | `CREATE INDEX idx_index_proposals_applied_by ON public.index_proposals USING btree (applied_by)` |
| idx_index_proposals_proposed_by | btree | proposed_by | não | sim |  | `CREATE INDEX idx_index_proposals_proposed_by ON public.index_proposals USING btree (proposed_by)` |
| idx_index_proposals_status | btree | status, created_at | não | sim |  | `CREATE INDEX idx_index_proposals_status ON public.index_proposals USING btree (status, created_at DESC)` |
| index_proposals_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX index_proposals_pkey ON public.index_proposals USING btree (id)` |


## Policies (RLS)

### `Admins can insert index proposals`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `has_role(auth.uid(), 'admin'::app_role)` |

### `Admins can update index proposals`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |

### `Admins can view index proposals`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `has_role(auth.uid(), 'admin'::app_role)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| tr_capture_index_proposal_baseline | BEFORE | INSERT | ROW | enabled | public.capture_index_proposal_baseline |
| trg_index_proposals_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| anon | MAINTAIN, SELECT |
| authenticated | DELETE, INSERT, MAINTAIN, SELECT, UPDATE |
| service_role | DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |

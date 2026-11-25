-- Desfaz a 20261125162000 recriando os quatro indices exatamente como estavam no banco
-- (pg_indexes, 2026-11-25). Rollback aplicado fora do aplicar-migration.yml, direto no banco.

begin;

create index if not exists idx_entregas_cliente_status
  on public.entregas using btree (cliente_id, status);

create index if not exists idx_entregas_status_composite
  on public.entregas using btree (status, created_at desc) where (deleted_at is null);

create index if not exists idx_entregas_status_active
  on public.entregas using btree (status) where (deleted_at is null);

create index if not exists idx_coletas_status_active
  on public.coletas using btree (status) where (deleted_at is null);

commit;

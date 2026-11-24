-- Onda 6 do plano v2, etapas 237, 238 e 239.
-- Censo no banco ao vivo (ref jvfhclubfpxrtrrazrgr, 2026-11-24) base das decisoes:
--   entregas(transportadora_id): idx_entregas_transportadora_id = 343 idx_scan | idx_entregas_transportadora = 0 e parcial
--   coletas(transportadora_id):  idx_coletas_transportadora_id  = 0   idx_scan | idx_coletas_transportadora  = 0 e parcial
--   audit_logs(record_id, table_name): idx_audit_logs_record_composite cobre o par + created_at DESC
-- Nenhum dos tres sustenta constraint (conferido em pg_constraint) e nenhum e de particao.
-- Aplicar em transacao (aplicar-migration.yml), sem CONCURRENTLY.

-- 237: fica o nome com sufixo _id, padronizado pela migration 20260711194400
DROP INDEX IF EXISTS public.idx_entregas_transportadora;

-- 238: mesma regra; idx_coletas_transp_status (transportadora_id, status) segue intacto
DROP INDEX IF EXISTS public.idx_coletas_transportadora;

-- 239: prefixo redundante de idx_audit_logs_record_composite (record_id, table_name, created_at DESC)
DROP INDEX IF EXISTS public.idx_audit_logs_record_id_table;

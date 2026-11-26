-- Remove 7 funcoes sem nenhum chamador, comprovadas orfas em 26/11 pelo censo de cobertura UI
-- (docs/qa/08-AUDITORIA-COBERTURA-UI.md). Cada uma foi conferida no catalogo de producao:
-- 0 triggers, 0 mencoes no corpo de outra funcao, 0 politicas de RLS, 0 cron jobs e nenhuma
-- chamada em src/, supabase/functions/ ou scripts/ (fora das migrations e dos artefatos gerados).
--
-- Definicao original de cada uma, para rollback:
--   audit_trigger_func                 -> 20251215143615 (recriada em 20260513190513)
--   fn_audit_trigger                   -> 20260314181126 (recriada em 20260513190513)
--   tr_increment_version               -> 20260513192119
--   update_fretes_internos_updated_at  -> 20251220115808_create_fretes_internos.sql
--   update_performance_metrics         -> 20260519115243
--   jsonb_recursive_merge              -> 20260519120742
--   validate_payload_schema            -> 20260519171908
--
-- Nao toca em tabela: as duplicatas vazias (system_adr, system_contract_schemas) ficam para o dono,
-- porque apagar tabela e dado, nao so catalogo.

DROP FUNCTION IF EXISTS public.audit_trigger_func();
DROP FUNCTION IF EXISTS public.fn_audit_trigger();
DROP FUNCTION IF EXISTS public.tr_increment_version();
DROP FUNCTION IF EXISTS public.update_fretes_internos_updated_at();
DROP FUNCTION IF EXISTS public.update_performance_metrics();
DROP FUNCTION IF EXISTS public.jsonb_recursive_merge(jsonb, jsonb);
DROP FUNCTION IF EXISTS public.validate_payload_schema(text, jsonb);

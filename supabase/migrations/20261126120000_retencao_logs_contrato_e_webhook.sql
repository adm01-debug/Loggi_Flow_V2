-- Retencao dos dois logs operacionais que crescem sem limite.
--
-- 1) `purge_webhook_inbound_failures(_keep_days)`: a funcao existe desde 20261125093000 e nenhum
--    dos 28 cron jobs a chamava, entao `webhook_inbound_failures` so crescia. Achado do censo de
--    cobertura UI de 26/11 (docs/qa/08-AUDITORIA-COBERTURA-UI.md).
-- 2) `contract_test_logs`: log da validacao de contrato das 5 edge functions, sem rotina de
--    limpeza. Em 26/11 tinha 1.775 linhas, 1.512 delas gravadas em novembro pelos smoke tests
--    `supabase/functions/*/index_test.ts` (payload {"__fuzz__": true}), que apontam para o
--    VITE_SUPABASE_URL do ambiente.
--
-- Idempotente: recriar a funcao e reagendar os jobs nao duplica nada.

CREATE OR REPLACE FUNCTION public.cleanup_old_contract_test_logs(days_to_keep integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.contract_test_logs
   WHERE created_at < now() - make_interval(days => days_to_keep);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$function$;

REVOKE ALL ON FUNCTION public.cleanup_old_contract_test_logs(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_old_contract_test_logs(integer) TO service_role;

DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-webhook-inbound-failures-daily') THEN
    PERFORM cron.unschedule('purge-webhook-inbound-failures-daily');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-contract-test-logs-daily') THEN
    PERFORM cron.unschedule('cleanup-contract-test-logs-daily');
  END IF;
END
$do$;

SELECT cron.schedule('purge-webhook-inbound-failures-daily', '35 3 * * *', 'SELECT public.purge_webhook_inbound_failures(90);');
SELECT cron.schedule('cleanup-contract-test-logs-daily', '45 3 * * *', 'SELECT public.cleanup_old_contract_test_logs(30);');

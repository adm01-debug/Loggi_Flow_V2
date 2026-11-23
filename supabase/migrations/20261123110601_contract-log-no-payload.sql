-- Etapa 015 do plano de 190 etapas: contract_test_logs não deve armazenar payload bruto (LGPD)
-- Adiciona coluna payload_hash (SHA-256 hex do payload) e remove uso de payload na aplicação.
-- A coluna payload existente é mantida para compatibilidade mas não mais populada.

ALTER TABLE public.contract_test_logs
  ADD COLUMN IF NOT EXISTS payload_hash TEXT;

COMMENT ON COLUMN public.contract_test_logs.payload_hash IS 
  'SHA-256 hex do payload validado. O payload bruto não é mais armazenado (LGPD/privacidade).';

-- Plano v2 (2026-08-31): audit_log_trigger em rate_limit_logs gerava 1 linha de audit_logs por evento de rate limit
-- (na origem 4.501 de 4.654 audit_logs = 96,7% eram esse ruido). Log de log nao tem valor de auditoria e dobra as escritas.
DROP TRIGGER IF EXISTS audit_log_trigger ON public.rate_limit_logs;
DELETE FROM public.audit_logs WHERE table_name = 'rate_limit_logs' AND true;

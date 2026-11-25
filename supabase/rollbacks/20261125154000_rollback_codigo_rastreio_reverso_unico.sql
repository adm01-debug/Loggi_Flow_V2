-- Rollback da etapa 027: remove o indice unico parcial do codigo de rastreio reverso.
DROP INDEX IF EXISTS public.ux_logistica_reversa_codigo_rastreio;
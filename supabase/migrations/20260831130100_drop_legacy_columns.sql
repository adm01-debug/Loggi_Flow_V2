-- Plano v2 etapa 18: colunas so-destino sem uso (0 ocorrencias em src/ e supabase/functions/; so types.ts gerado)
ALTER TABLE public.coletas DROP COLUMN IF EXISTS created_by;
ALTER TABLE public.fretes_internos DROP COLUMN IF EXISTS created_by;
ALTER TABLE public.fretes_internos DROP COLUMN IF EXISTS data_criacao;

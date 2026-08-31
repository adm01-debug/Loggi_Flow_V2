-- 1. Fix search_path for user-defined functions only
DO $$
DECLARE
    f record;
BEGIN
    FOR f IN 
        SELECT p.proname, oidvectortypes(p.proargtypes) as args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        LEFT JOIN pg_depend d ON d.objid = p.oid AND d.deptype = 'e'
        WHERE n.nspname = 'public'
        AND d.objid IS NULL -- Skip functions owned by extensions
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = public', f.proname, f.args);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not alter function %', f.proname;
        END;
    END LOOP;
END;
$$;

-- 2. Foreign Key Indexes for optimization
CREATE INDEX IF NOT EXISTS idx_ocorrencias_entrega ON public.ocorrencias(entrega_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_coleta ON public.ocorrencias(coleta_id);
CREATE INDEX IF NOT EXISTS idx_entregas_cliente ON public.entregas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_entregas_transportadora ON public.entregas(transportadora_id);
CREATE INDEX IF NOT EXISTS idx_coletas_fornecedor ON public.coletas(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_coletas_transportadora ON public.coletas(transportadora_id);
CREATE INDEX IF NOT EXISTS idx_entregas_status ON public.entregas(status);
CREATE INDEX IF NOT EXISTS idx_coletas_status ON public.coletas(status);

-- 3. Extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

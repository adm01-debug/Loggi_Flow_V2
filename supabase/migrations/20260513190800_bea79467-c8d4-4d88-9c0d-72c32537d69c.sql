-- Bloqueio preventivo de acesso anônimo a funções que ainda possam estar expostas
DO $$ 
DECLARE 
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT routine_schema, routine_name 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_type = 'FUNCTION'
        AND routine_name NOT IN ('has_role', 'has_permission', 'get_public_tracking', 'get_active_maintenance_mode')
    LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I FROM PUBLIC, anon;', func_record.routine_schema, func_record.routine_name);
        EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I TO authenticated, service_role;', func_record.routine_schema, func_record.routine_name);
    END LOOP;
END $$;

-- Garantir search_path seguro em funções críticas que sobraram
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public, pg_catalog, pg_temp;
ALTER FUNCTION public.has_permission(uuid, text) SET search_path = public, pg_catalog, pg_temp;

-- Criação de tabela para registro de decisões de arquitetura (metadados para o sistema)
CREATE TABLE IF NOT EXISTS public.architecture_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'accepted', -- proposed, accepted, superseded, deprecated
    context TEXT,
    decision TEXT,
    consequences TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS e permissões apenas para admins
ALTER TABLE public.architecture_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ADRs" 
ON public.architecture_decisions 
FOR ALL 
TO authenticated 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Registrar a primeira decisão de arquitetura via SQL para garantir persistência no banco
INSERT INTO public.architecture_decisions (title, status, context, decision, consequences)
VALUES (
    'ADR 0001: Arquitetura Feature-Based e Limites de Arquivo',
    'accepted',
    'O sistema cresceu para +69k LOC e a manutenibilidade torna-se crítica.',
    'Adotar rigorosamente o padrão feature-based com limite de 400 linhas por arquivo TSX/TS e proibição de dependências circulares.',
    'Melhor separação de interesses, facilidade de testes unitários e carregamento mais rápido via Vite.'
);

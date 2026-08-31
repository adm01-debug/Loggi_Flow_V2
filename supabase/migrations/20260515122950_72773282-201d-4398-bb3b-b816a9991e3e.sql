DO $$ 
DECLARE 
    t text;
BEGIN 
    -- Corrigir políticas de INSERT em todas as partições de audit_logs
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND (tablename LIKE 'audit_logs_%' OR tablename = 'audit_logs')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Authenticated can insert audit logs" ON public.%I FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)', t);
    END LOOP;

    -- Corrigir políticas de INSERT em todas as partições de rastreamento_historico
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'rastreamento_historico_%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Authenticated can insert tracking data %s" ON public.%I', substring(t from 24), t);
        EXECUTE format('CREATE POLICY "Authenticated can insert tracking data" ON public.%I FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)', t);
    END LOOP;
END $$;

-- Reforçar reward_items (loja)
DROP POLICY IF EXISTS "Todos podem ver itens da loja" ON public.reward_items;
CREATE POLICY "Authenticated users can view reward items" ON public.reward_items FOR SELECT USING (auth.uid() IS NOT NULL);

-- Reforçar feature_flags
DROP POLICY IF EXISTS "Everyone can view feature flags" ON public.feature_flags;
CREATE POLICY "Authenticated users can view feature flags" ON public.feature_flags FOR SELECT USING (auth.uid() IS NOT NULL);

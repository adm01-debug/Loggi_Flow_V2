
-- Remove rastreamento_alertas from Realtime (admin-only data)
ALTER PUBLICATION supabase_realtime DROP TABLE public.rastreamento_alertas;

-- Remove conciliacoes from Realtime (creator/admin scoped, not needed in realtime for all)
ALTER PUBLICATION supabase_realtime DROP TABLE public.conciliacoes;

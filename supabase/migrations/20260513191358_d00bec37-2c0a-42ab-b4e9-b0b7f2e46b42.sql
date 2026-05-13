-- Enable RLS for rastreamento_historico partitions
ALTER TABLE public.rastreamento_historico_y2026m01 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rastreamento_historico_y2026m02 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rastreamento_historico_y2026m03 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rastreamento_historico_y2026m04 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rastreamento_historico_y2026m05 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rastreamento_historico_y2026m06 ENABLE ROW LEVEL SECURITY;

-- Note: Policies on partitioned tables are inherited by partitions in PG 11+,
-- but RLS must be enabled on each partition explicitly in Supabase/PostgreSQL.

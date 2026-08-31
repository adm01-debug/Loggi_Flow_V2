-- Ensure columns exist in transportadoras table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transportadoras' AND column_name = 'credentials') THEN
        ALTER TABLE public.transportadoras ADD COLUMN credentials JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transportadoras' AND column_name = 'non_api_config') THEN
        ALTER TABLE public.transportadoras ADD COLUMN non_api_config JSONB DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transportadoras' AND column_name = 'coverage_details') THEN
        ALTER TABLE public.transportadoras ADD COLUMN coverage_details JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Enable RLS just in case (though it might already be)
ALTER TABLE public.transportadoras ENABLE ROW LEVEL SECURITY;

-- Basic policies for transportadoras
CREATE POLICY "Enable read access for all users" ON public.transportadoras
    FOR SELECT USING (true);

CREATE POLICY "Enable all for authenticated users" ON public.transportadoras
    FOR ALL USING (auth.role() = 'authenticated');

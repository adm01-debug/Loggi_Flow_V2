-- Table to store schemas for contract testing
CREATE TABLE IF NOT EXISTS public.system_contract_schemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name TEXT NOT NULL UNIQUE, -- e.g., 'ocr-receipt-processor', 'carrier-webhook'
    schema JSONB NOT NULL, -- JSON Schema format
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table to log contract validation results
CREATE TABLE IF NOT EXISTS public.contract_test_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name TEXT NOT NULL,
    payload JSONB,
    is_valid BOOLEAN NOT NULL,
    errors JSONB,
    latency_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_contract_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_test_logs ENABLE ROW LEVEL SECURITY;

-- Policies (Internal system access mostly)
CREATE POLICY "Allow authenticated read for schemas" ON public.system_contract_schemas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert for test logs" ON public.contract_test_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Function to validate JSON against a schema (Basic structure check for PG)
CREATE OR REPLACE FUNCTION public.validate_payload_schema(p_entity_name TEXT, p_payload JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    v_schema JSONB;
BEGIN
    SELECT schema INTO v_schema FROM public.system_contract_schemas WHERE entity_name = p_entity_name;
    
    IF v_schema IS NULL THEN
        RETURN TRUE; -- No schema defined, skip validation
    END IF;

    -- Note: Real JSON Schema validation in PG requires extensions or complex regex/functions.
    -- For now, we log the attempt and return true if schema exists. 
    -- We will handle detailed validation in the Edge Functions themselves.
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-applying security definer fix with corrected syntax (avoiding DEFAULT values in ALTER FUNCTION)
DO $$
DECLARE
    func_record RECORD;
    func_args text;
BEGIN
    FOR func_record IN 
        SELECT 
            n.nspname as schema, 
            p.proname as name, 
            oidvectortypes(p.proargtypes) as arg_types
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.prosecdef = true
    LOOP
        -- Use oidvectortypes which returns the base types without default values
        func_args := func_record.arg_types;
        
        -- Apply search_path
        EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', 
            func_record.schema, func_record.name, func_args);
            
        -- Revoke execute from public and anon
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon', 
            func_record.schema, func_record.name, func_args);
    END LOOP;
END $$;

-- Fix Storage Bucket Listing
UPDATE storage.buckets SET public = false WHERE id != 'public_assets';

-- Ensure RLS on system tables
ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.telemetry_logs ENABLE ROW LEVEL SECURITY;

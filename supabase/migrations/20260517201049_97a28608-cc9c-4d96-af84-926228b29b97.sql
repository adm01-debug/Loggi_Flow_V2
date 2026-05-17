-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Move common extensions out of public to extensions schema
-- Note: This depends on what's installed, but standard practice
DO $$ 
BEGIN
    -- Only attempt to move if they are in the public schema
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net' AND (SELECT nspname FROM pg_namespace WHERE oid = (SELECT extnamespace FROM pg_extension WHERE extname = 'pg_net')) = 'public') THEN
        ALTER EXTENSION "pg_net" SET SCHEMA extensions;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements' AND (SELECT nspname FROM pg_namespace WHERE oid = (SELECT extnamespace FROM pg_extension WHERE extname = 'pg_stat_statements')) = 'public') THEN
        ALTER EXTENSION "pg_stat_statements" SET SCHEMA extensions;
    END IF;
END $$;

-- Revoke public execution permissions
REVOKE EXECUTE ON FUNCTION public.update_user_rank() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_log_trigger() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_monthly_analytics(timestamp with time zone, timestamp with time zone) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_carrier_performance_stats() FROM PUBLIC;

-- Grant execution to authenticated role only
GRANT EXECUTE ON FUNCTION public.update_user_rank() TO authenticated;
GRANT EXECUTE ON FUNCTION public.audit_log_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_monthly_analytics(timestamp with time zone, timestamp with time zone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_carrier_performance_stats() TO authenticated;

-- Ensure internal triggers are only callable by the system/postgres
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_levels() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_audit_trigger() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_log_trigger() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_trigger_func() FROM PUBLIC;

-- Final cleanup of any other SD functions found in audit
REVOKE EXECUTE ON FUNCTION public.get_dashboard_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_metrics() TO authenticated;

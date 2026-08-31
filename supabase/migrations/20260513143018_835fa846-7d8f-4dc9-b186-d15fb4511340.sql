-- 1. Drop the incorrect partitioned table and its partitions
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- 2. Re-create partitioned table with correct columns
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_fields TEXT[],
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

-- Add primary key (must include partition key)
ALTER TABLE public.audit_logs ADD PRIMARY KEY (id, created_at);

-- 3. Re-create initial partitions and enable RLS on each
DO $$
DECLARE
    m INTEGER;
    partition_name TEXT;
    start_date TEXT;
    end_date TEXT;
BEGIN
    FOR m IN 1..12 LOOP
        partition_name := 'audit_logs_y2026m' || LPAD(m::text, 2, '0');
        start_date := '2026-' || LPAD(m::text, 2, '0') || '-01';
        -- Simple logic for end date (next month)
        IF m = 12 THEN
            end_date := '2027-01-01';
        ELSE
            end_date := '2026-' || LPAD((m+1)::text, 2, '0') || '-01';
        END IF;
        
        EXECUTE format('CREATE TABLE public.%I PARTITION OF public.audit_logs FOR VALUES FROM (%L) TO (%L)', partition_name, start_date, end_date);
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', partition_name);
    END LOOP;
END $$;

-- 4. Enable RLS on parent table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. Re-create policies
CREATE POLICY "Admin can view all audit logs" ON public.audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- 6. Migrate data from backup (if it exists)
INSERT INTO public.audit_logs (id, table_name, record_id, action, old_data, new_data, changed_fields, user_id, user_email, user_name, ip_address, user_agent, created_at)
SELECT id, table_name, record_id, action, old_data, new_data, changed_fields, user_id, user_email, user_name, ip_address, user_agent, created_at FROM public.audit_logs_old;

-- 7. Drop backup table
DROP TABLE public.audit_logs_old;

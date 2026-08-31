-- Step 1: Create the partitioned table structure
CREATE TABLE public.audit_logs_partitioned (
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at) -- Partition key must be part of PK
) PARTITION BY RANGE (created_at);

-- Step 2: Create initial partitions
CREATE TABLE public.audit_logs_y2024_m12 PARTITION OF public.audit_logs_partitioned
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

CREATE TABLE public.audit_logs_y2025_m01 PARTITION OF public.audit_logs_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE public.audit_logs_y2025_m02 PARTITION OF public.audit_logs_partitioned
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE public.audit_logs_y2025_m03 PARTITION OF public.audit_logs_partitioned
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

CREATE TABLE public.audit_logs_y2025_m04 PARTITION OF public.audit_logs_partitioned
    FOR VALUES FROM ('2025-04-01') TO ('2025-05-01');

CREATE TABLE public.audit_logs_y2025_m05 PARTITION OF public.audit_logs_partitioned
    FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');

CREATE TABLE public.audit_logs_y2025_m06 PARTITION OF public.audit_logs_partitioned
    FOR VALUES FROM ('2025-06-01') TO ('2026-01-01'); -- Catch-all for 2025

-- Step 3: Migrate existing data
INSERT INTO public.audit_logs_partitioned 
SELECT * FROM public.audit_logs;

-- Step 4: Swap tables
ALTER TABLE public.audit_logs RENAME TO audit_logs_old;
ALTER TABLE public.audit_logs_partitioned RENAME TO audit_logs;

-- Step 5: Re-enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admins to view audit logs"
ON public.audit_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Allow systems/users to insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Step 6: Cleanup (Optional, but safe to keep for a while)
-- DROP TABLE public.audit_logs_old;

-- Step 7: Update trigger function to point to the new structure if needed
-- (Since table name is the same, triggers should work if they didn't rely on specific OIDs)

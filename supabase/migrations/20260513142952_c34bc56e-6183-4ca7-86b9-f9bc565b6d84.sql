-- 1. Optimistic Locking
-- Add version column to critical tables
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE public.cotacoes_frete ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE public.transportadoras ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Function to increment version
CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS tr_entregas_version ON public.entregas;
CREATE TRIGGER tr_entregas_version
BEFORE UPDATE ON public.entregas
FOR EACH ROW
EXECUTE FUNCTION public.increment_version();

DROP TRIGGER IF EXISTS tr_cotacoes_frete_version ON public.cotacoes_frete;
CREATE TRIGGER tr_cotacoes_frete_version
BEFORE UPDATE ON public.cotacoes_frete
FOR EACH ROW
EXECUTE FUNCTION public.increment_version();

DROP TRIGGER IF EXISTS tr_transportadoras_version ON public.transportadoras;
CREATE TRIGGER tr_transportadoras_version
BEFORE UPDATE ON public.transportadoras
FOR EACH ROW
EXECUTE FUNCTION public.increment_version();

-- 2. Partitioning audit_logs
-- Since we can't easily convert an existing table to partitioned without data migration,
-- we'll create a new partitioned table and migrate if possible, or start new.
-- Given the 'Lovable' context, we'll try to be safe.

-- Rename current table to backup
ALTER TABLE public.audit_logs RENAME TO audit_logs_old;

-- Create partitioned table
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

-- Add primary key (must include partition key)
ALTER TABLE public.audit_logs ADD PRIMARY KEY (id, created_at);

-- Create initial partitions
CREATE TABLE public.audit_logs_y2026m01 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE public.audit_logs_y2026m02 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE public.audit_logs_y2026m03 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE public.audit_logs_y2026m04 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE public.audit_logs_y2026m05 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE public.audit_logs_y2026m06 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE public.audit_logs_y2026m07 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE public.audit_logs_y2026m08 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE public.audit_logs_y2026m09 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE public.audit_logs_y2026m10 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE public.audit_logs_y2026m11 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE public.audit_logs_y2026m12 PARTITION OF public.audit_logs FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Re-enable RLS on new table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Migration of data (optional but recommended)
-- INSERT INTO public.audit_logs SELECT * FROM public.audit_logs_old;

-- Note: We need to recreate policies for the new table
CREATE POLICY "Admin can view all audit logs" ON public.audit_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

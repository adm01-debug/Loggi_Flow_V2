-- 1. Índices compostos para performance (baseado nas tabelas existentes)
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id_table ON public.audit_logs (record_id, table_name);
CREATE INDEX IF NOT EXISTS idx_cotacoes_multicanal_user_status ON public.cotacoes_multicanal (user_id, status);

-- 2. Controle de concorrência otimista (Optimistic Locking)
ALTER TABLE public.logistica_reversa ADD COLUMN IF NOT EXISTS version INT DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_logistica_reversa_version ON public.logistica_reversa;
CREATE TRIGGER trg_increment_logistica_reversa_version
BEFORE UPDATE ON public.logistica_reversa
FOR EACH ROW
EXECUTE FUNCTION public.increment_version();

-- 3. Idempotência para Webhooks
CREATE TABLE IF NOT EXISTS public.webhook_events_processed (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL,
    provider TEXT NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.webhook_events_processed ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'webhook_events_processed' AND policyname = 'Admins can view webhook logs'
    ) THEN
        CREATE POLICY "Admins can view webhook logs" ON public.webhook_events_processed FOR SELECT USING (
            auth.uid() IN (SELECT id FROM public.profiles WHERE cargo = 'admin')
        );
    END IF;
END $$;

-- 4. Performance em grandes volumes via BRIN
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_brin ON public.audit_logs USING BRIN (created_at);

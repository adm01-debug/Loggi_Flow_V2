-- Performance Optimization: Audit Logs Search
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs (record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs (table_name);

-- Performance Optimization: Cotacoes
CREATE INDEX IF NOT EXISTS idx_cotacoes_frete_created_at ON public.cotacoes_frete (created_at DESC);

-- Performance Optimization: Rastreamento (using coleta_id based on schema check)
CREATE INDEX IF NOT EXISTS idx_rastreamento_historico_coleta_id ON public.rastreamento_historico (coleta_id) WHERE coleta_id IS NOT NULL;

-- Optimistic Locking Support
ALTER TABLE public.entregas ADD COLUMN IF NOT EXISTS version INT DEFAULT 0;
ALTER TABLE public.coletas ADD COLUMN IF NOT EXISTS version INT DEFAULT 0;

-- Trigger function for version increment (idempotent definition)
CREATE OR REPLACE FUNCTION public.increment_version_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to main tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_increment_entregas_version') THEN
    CREATE TRIGGER tr_increment_entregas_version
    BEFORE UPDATE ON public.entregas
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_version_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'tr_increment_coletas_version') THEN
    CREATE TRIGGER tr_increment_coletas_version
    BEFORE UPDATE ON public.coletas
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_version_column();
  END IF;
END $$;

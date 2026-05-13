-- Índices compostos para performance
CREATE INDEX IF NOT EXISTS idx_entregas_status_created ON public.entregas (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id_created ON public.audit_logs (record_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cotacoes_frete_entrega_id ON public.cotacoes_frete (entrega_id);

-- Recriar função com search_path seguro
CREATE OR REPLACE FUNCTION public.handle_optimistic_locking()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;
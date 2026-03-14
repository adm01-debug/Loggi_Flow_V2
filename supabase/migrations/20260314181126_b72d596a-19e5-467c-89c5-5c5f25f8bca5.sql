
-- =============================================
-- Sprint 5: Performance Indexes
-- =============================================

-- Entregas: filter by status + sort by created_at
CREATE INDEX IF NOT EXISTS idx_entregas_status_created ON public.entregas (status, created_at DESC);

-- Coletas: filter by status + sort by data_prevista_coleta
CREATE INDEX IF NOT EXISTS idx_coletas_status_data ON public.coletas (status, data_prevista_coleta DESC);

-- Ocorrencias: lookup by entrega_id + sort by created_at
CREATE INDEX IF NOT EXISTS idx_ocorrencias_entrega_id ON public.ocorrencias (entrega_id, created_at DESC);

-- Notifications: user notifications lookup
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, read, created_at DESC);

-- Audit logs: lookup by table + record
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON public.audit_logs (table_name, record_id);

-- Rate limit logs: lookup by IP + endpoint
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_endpoint ON public.rate_limit_logs (ip_address, endpoint, window_start DESC);

-- =============================================
-- Sprint 5: Audit Triggers for Sensitive Tables
-- =============================================

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed_cols text[];
  col text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      table_name, record_id, action, old_data, user_id
    ) VALUES (
      TG_TABLE_NAME,
      OLD.id::text,
      'DELETE',
      to_jsonb(OLD),
      auth.uid()
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Compute changed fields
    changed_cols := ARRAY[]::text[];
    FOR col IN SELECT column_name FROM information_schema.columns WHERE table_schema = TG_TABLE_SCHEMA AND table_name = TG_TABLE_NAME LOOP
      IF to_jsonb(NEW) ->> col IS DISTINCT FROM to_jsonb(OLD) ->> col THEN
        changed_cols := changed_cols || col;
      END IF;
    END LOOP;
    
    INSERT INTO public.audit_logs (
      table_name, record_id, action, old_data, new_data, changed_fields, user_id
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id::text,
      'UPDATE',
      to_jsonb(OLD),
      to_jsonb(NEW),
      changed_cols,
      auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      table_name, record_id, action, new_data, user_id
    ) VALUES (
      TG_TABLE_NAME,
      NEW.id::text,
      'INSERT',
      to_jsonb(NEW),
      auth.uid()
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Attach audit triggers to sensitive tables
CREATE TRIGGER trg_audit_transportadoras
  AFTER INSERT OR UPDATE OR DELETE ON public.transportadoras
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

CREATE TRIGGER trg_audit_tabelas_frete
  AFTER INSERT OR UPDATE OR DELETE ON public.tabelas_frete
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

CREATE TRIGGER trg_audit_alertas_custo
  AFTER INSERT OR UPDATE OR DELETE ON public.alertas_custo
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

CREATE TRIGGER trg_audit_cotacoes_frete
  AFTER INSERT OR UPDATE OR DELETE ON public.cotacoes_frete
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

CREATE TRIGGER trg_audit_business_rules
  AFTER INSERT OR UPDATE OR DELETE ON public.business_rules
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

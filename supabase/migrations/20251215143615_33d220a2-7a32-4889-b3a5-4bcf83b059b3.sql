-- Create audit_logs table for complete traceability
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_name TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON public.audit_logs(record_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert logs (no user restriction for inserts via triggers)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- Create generic audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_data JSONB := NULL;
  new_data JSONB := NULL;
  changed_fields TEXT[] := ARRAY[]::TEXT[];
  current_user_id UUID;
  current_user_email TEXT;
  current_user_name TEXT;
  field_name TEXT;
BEGIN
  -- Get current user info from auth context
  current_user_id := auth.uid();
  
  IF current_user_id IS NOT NULL THEN
    SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;
    SELECT full_name INTO current_user_name FROM public.profiles WHERE id = current_user_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    INSERT INTO public.audit_logs (
      table_name, record_id, action, old_data, new_data, changed_fields,
      user_id, user_email, user_name
    ) VALUES (
      TG_TABLE_NAME, OLD.id, TG_OP, old_data, NULL, NULL,
      current_user_id, current_user_email, current_user_name
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    
    -- Detect changed fields
    FOR field_name IN SELECT jsonb_object_keys(new_data)
    LOOP
      IF (old_data->field_name) IS DISTINCT FROM (new_data->field_name) THEN
        changed_fields := array_append(changed_fields, field_name);
      END IF;
    END LOOP;
    
    -- Only log if there are actual changes
    IF array_length(changed_fields, 1) > 0 THEN
      INSERT INTO public.audit_logs (
        table_name, record_id, action, old_data, new_data, changed_fields,
        user_id, user_email, user_name
      ) VALUES (
        TG_TABLE_NAME, NEW.id, TG_OP, old_data, new_data, changed_fields,
        current_user_id, current_user_email, current_user_name
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    new_data := to_jsonb(NEW);
    INSERT INTO public.audit_logs (
      table_name, record_id, action, old_data, new_data, changed_fields,
      user_id, user_email, user_name
    ) VALUES (
      TG_TABLE_NAME, NEW.id, TG_OP, NULL, new_data, NULL,
      current_user_id, current_user_email, current_user_name
    );
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create triggers for all main tables
CREATE TRIGGER audit_coletas
  AFTER INSERT OR UPDATE OR DELETE ON public.coletas
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_entregas
  AFTER INSERT OR UPDATE OR DELETE ON public.entregas
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_fornecedores
  AFTER INSERT OR UPDATE OR DELETE ON public.fornecedores
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_clientes
  AFTER INSERT OR UPDATE OR DELETE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_transportadoras
  AFTER INSERT OR UPDATE OR DELETE ON public.transportadoras
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_ocorrencias
  AFTER INSERT OR UPDATE OR DELETE ON public.ocorrencias
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

CREATE TRIGGER audit_cotacoes_frete
  AFTER INSERT OR UPDATE OR DELETE ON public.cotacoes_frete
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();
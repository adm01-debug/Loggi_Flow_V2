-- Audit log trigger for important tables
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS trigger AS $$
BEGIN
  INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, user_id)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to coletas
DROP TRIGGER IF EXISTS audit_coletas ON coletas;
CREATE TRIGGER audit_coletas AFTER INSERT OR UPDATE OR DELETE ON coletas
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

-- Apply to entregas
DROP TRIGGER IF EXISTS audit_entregas ON entregas;
CREATE TRIGGER audit_entregas AFTER INSERT OR UPDATE OR DELETE ON entregas
FOR EACH ROW EXECUTE FUNCTION audit_log_trigger();

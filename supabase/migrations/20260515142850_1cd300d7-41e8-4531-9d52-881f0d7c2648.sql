-- Melhora a função de auditoria para capturar metadados (se disponíveis)
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS trigger AS $$
DECLARE
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();
    
    INSERT INTO public.audit_logs (
        table_name, 
        record_id, 
        action, 
        old_data, 
        new_data, 
        user_id
    )
    VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
        current_user_id
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar a tabelas adicionais
DO $$ 
DECLARE 
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM (VALUES ('fornecedores'), ('transportadoras'), ('clientes'), ('cotacoes_frete'), ('fretes_internos')) AS tables(table_name)
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON %I', t, t);
        EXECUTE format('CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger()', t, t);
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.audit_log_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid;
    record_id_val   text;
    new_json        jsonb;
    old_json        jsonb;
BEGIN
    current_user_id := auth.uid();

    -- Extrair ID de forma defensiva: tenta 'id', depois 'key', depois uuid da linha
    -- row_to_json retorna NULL para chaves inexistentes — sem crash
    new_json := CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END;
    old_json := CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END;

    record_id_val := COALESCE(
        (COALESCE(new_json, old_json) ->> 'id'),    -- coluna id (uuid padrão)
        (COALESCE(new_json, old_json) ->> 'key'),   -- coluna key (business_rules_config, feature_flags)
        (COALESCE(new_json, old_json) ->> 'version'), -- coluna version (schema_migrations)
        '?'
    );

    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        action,
        old_data,
        new_data,
        user_id
    ) VALUES (
        TG_TABLE_NAME,
        record_id_val,
        TG_OP,
        old_json,
        new_json,
        current_user_id
    );

    RETURN COALESCE(NEW, OLD);
END;
$function$

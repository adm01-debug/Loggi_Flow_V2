CREATE OR REPLACE FUNCTION public.validate_frete_values()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.valor_frete < 0 THEN
        RAISE EXCEPTION 'O valor do frete não pode ser negativo.';
    END IF;
    RETURN NEW;
END;
$function$

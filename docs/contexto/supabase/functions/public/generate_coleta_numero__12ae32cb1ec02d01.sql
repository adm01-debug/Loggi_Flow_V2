CREATE OR REPLACE FUNCTION public.generate_coleta_numero()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.numero_coleta = 'COL-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('coleta_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$function$

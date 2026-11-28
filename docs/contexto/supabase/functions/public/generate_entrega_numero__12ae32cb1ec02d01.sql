CREATE OR REPLACE FUNCTION public.generate_entrega_numero()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.numero_entrega = 'ENT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('entrega_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$function$

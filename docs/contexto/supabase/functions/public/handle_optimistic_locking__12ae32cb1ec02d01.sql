CREATE OR REPLACE FUNCTION public.handle_optimistic_locking()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$function$

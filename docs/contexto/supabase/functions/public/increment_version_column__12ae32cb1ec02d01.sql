CREATE OR REPLACE FUNCTION public.increment_version_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD IS NOT DISTINCT FROM NEW THEN
    RETURN NEW;
  END IF;
  NEW.version = COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$function$

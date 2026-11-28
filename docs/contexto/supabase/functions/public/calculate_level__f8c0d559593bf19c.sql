CREATE OR REPLACE FUNCTION public.calculate_level(xp integer)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$ SELECT GREATEST(1, FLOOR(SQRT(xp / 100.0))::int + 1) $function$

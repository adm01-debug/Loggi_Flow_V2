CREATE OR REPLACE FUNCTION public.drop_old_partitions(p_parent_table text, p_prefix text, p_months_to_keep integer)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  r record;
  cutoff date := (date_trunc('month', now()) - (p_months_to_keep || ' months')::interval)::date;
  dropped int := 0;
  yr int; mo int;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname LIKE p_prefix || '%'
  LOOP
    -- Extract year/month from suffix like y2024_m12 or y2024m12
    BEGIN
      yr := substring(r.relname from 'y(\d{4})')::int;
      mo := substring(r.relname from 'm(\d{2})')::int;
      IF make_date(yr, mo, 1) < cutoff THEN
        EXECUTE format('DROP TABLE IF EXISTS public.%I', r.relname);
        dropped := dropped + 1;
      END IF;
    EXCEPTION WHEN OTHERS THEN CONTINUE;
    END;
  END LOOP;
  RETURN dropped;
END;
$function$

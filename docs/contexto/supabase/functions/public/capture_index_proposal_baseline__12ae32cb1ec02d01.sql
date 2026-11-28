CREATE OR REPLACE FUNCTION public.capture_index_proposal_baseline()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'internal', 'public', 'extensions', 'pg_catalog'
AS $function$
DECLARE
  v_mean double precision;
BEGIN
  IF NEW.queryid IS NOT NULL AND NEW.baseline_mean_ms IS NULL THEN
    BEGIN
      EXECUTE 'SELECT mean_exec_time FROM extensions.pg_stat_statements WHERE queryid = $1 LIMIT 1'
        INTO v_mean USING NEW.queryid;
      NEW.baseline_mean_ms := v_mean;
    EXCEPTION WHEN OTHERS THEN
      NEW.baseline_mean_ms := NULL;
    END;
  END IF;
  RETURN NEW;
END; $function$

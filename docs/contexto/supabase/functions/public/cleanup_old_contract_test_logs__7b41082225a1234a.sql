CREATE OR REPLACE FUNCTION public.cleanup_old_contract_test_logs(days_to_keep integer DEFAULT 30)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.contract_test_logs
   WHERE created_at < now() - make_interval(days => days_to_keep);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$function$

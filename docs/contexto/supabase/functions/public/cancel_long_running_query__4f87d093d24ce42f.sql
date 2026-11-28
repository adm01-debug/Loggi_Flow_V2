CREATE OR REPLACE FUNCTION public.cancel_long_running_query(p_pid integer, p_terminate boolean DEFAULT false)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_result boolean;
  v_query text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  IF p_pid IS NULL OR p_pid <= 0 THEN
    RAISE EXCEPTION 'Invalid PID';
  END IF;

  SELECT query INTO v_query FROM pg_stat_activity WHERE pid = p_pid;

  IF p_terminate THEN
    SELECT pg_terminate_backend(p_pid) INTO v_result;
  ELSE
    SELECT pg_cancel_backend(p_pid) INTO v_result;
  END IF;

  BEGIN
    INSERT INTO public.audit_logs (user_id, action, resource_type, record_id, metadata)
    VALUES (
      auth.uid(),
      CASE WHEN p_terminate THEN 'terminate_query' ELSE 'cancel_query' END,
      'pg_backend',
      p_pid::text,
      jsonb_build_object('pid', p_pid, 'terminate', p_terminate, 'success', v_result, 'query', left(coalesce(v_query, ''), 500))
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN v_result;
END;
$function$

CREATE OR REPLACE FUNCTION public.execute_nexus_protocol(vehicle_id text, protocol_name text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  log_id UUID;
BEGIN
  -- Insert a log entry for the protocol execution
  INSERT INTO public.nexus_tactical_logs (message, type, target_vehicle, protocol_executed)
  VALUES ('EXECUTING PROTOCOL: ' || protocol_name || ' ON UNIT ' || vehicle_id, 'info', vehicle_id, true)
  RETURNING id INTO log_id;

  RETURN jsonb_build_object(
    'success', true,
    'log_id', log_id,
    'timestamp', now()
  );
END;
$function$

-- Add vehicle and protocol info to logs
ALTER TABLE public.nexus_tactical_logs 
ADD COLUMN IF NOT EXISTS target_vehicle TEXT,
ADD COLUMN IF NOT EXISTS protocol_executed BOOLEAN DEFAULT false;

-- Create a function to simulate/trigger protocol execution
CREATE OR REPLACE FUNCTION public.execute_nexus_protocol(vehicle_id TEXT, protocol_name TEXT)
RETURNS JSONB AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

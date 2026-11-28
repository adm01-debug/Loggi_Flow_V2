CREATE OR REPLACE FUNCTION public.log_biometric_anomaly()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.severity = 'critical' OR NEW.heart_rate > 110 THEN
        INSERT INTO public.nexus_tactical_logs (
            module, 
            level, 
            message, 
            target_vehicle
        ) VALUES (
            'BIO_SYNC',
            'crit',
            'ANOMALIA DETECTADA: Batimento cardíaco elevado (' || NEW.heart_rate || ' BPM). Alerta de fadiga nível ' || NEW.fatigue_index,
            NEW.vehicle_id
        );
    END IF;
    RETURN NEW;
END;
$function$

-- Function to reconcile pending freights
CREATE OR REPLACE FUNCTION public.reconcile_pending_freights()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    reconciled_count integer := 0;
BEGIN
    -- Simula uma lógica de reconciliação real
    -- Atualiza fretes que estão 'pendentes' há mais de 24h para 'erro_verificado' ou similar se não houver atualização
    UPDATE public.freights
    SET status = 'error_reconciled',
        updated_at = now()
    WHERE status = 'pending' 
      AND created_at < now() - interval '24 hours';
      
    GET DIAGNOSTICS reconciled_count = ROW_COUNT;
    
    RETURN jsonb_build_object(
        'status', 'success',
        'reconciled_count', reconciled_count,
        'timestamp', now()
    );
END;
$$;

-- Function to cleanup old telemetry
CREATE OR REPLACE FUNCTION public.cleanup_old_telemetry_logs(days_to_keep integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count integer;
BEGIN
    DELETE FROM public.telemetry_logs
    WHERE created_at < now() - (days_to_keep || ' days')::interval;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

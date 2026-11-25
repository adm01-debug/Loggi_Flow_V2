-- Rollback da etapa 070: recria a funcao exatamente como estava no arquivo historico
-- supabase/migrations/20260519163240_a44a9ac2-837f-405f-ab86-8e651c62bd5b.sql.
CREATE OR REPLACE FUNCTION public.reconcile_pending_freights()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    reconciled_count integer := 0;
BEGIN
    -- Simula uma logica de reconciliacao real
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

REVOKE ALL ON FUNCTION public.reconcile_pending_freights() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reconcile_pending_freights() FROM authenticated;
REVOKE ALL ON FUNCTION public.reconcile_pending_freights() FROM anon;
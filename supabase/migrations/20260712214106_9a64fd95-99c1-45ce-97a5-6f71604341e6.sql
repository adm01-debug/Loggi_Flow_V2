-- Sprint A #1: Blindar SECURITY DEFINER functions
-- Revoga EXECUTE do role anon em funções de observabilidade/admin
-- Mantém get_public_tracking (portal público intencional) e authenticated (has_role interno)

-- === Observabilidade DB (admin-only) ===
REVOKE EXECUTE ON FUNCTION public.get_autovacuum_health(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_wraparound_status(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_active_sessions_summary() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_top_tables_by_size(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_rls_audit() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_extensions_audit() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_cache_hit_ratios(bigint, numeric, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_duplicate_indexes(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_lock_conflicts(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_long_running_queries(integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_temp_file_stats(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_replication_status() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_load_heatmap(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_maintenance_windows(integer, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_capacity_forecast_fast(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_global_health_score_fast() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_health_anomalies_fast() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_health_score_history_fast(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_index_roi_summary() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_query_detail_fast(bigint) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_query_index_suggestion(bigint) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_remediation_suggestions_fast() FROM anon;

-- === Ações de manutenção (admin-only, escrita) ===
REVOKE EXECUTE ON FUNCTION public.apply_index_proposal(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reject_index_proposal(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.auto_revert_ineffective_indexes(integer, numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cancel_long_running_query(integer, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.capture_index_proposal_baseline() FROM anon;
REVOKE EXECUTE ON FUNCTION public.measure_index_proposal_impact(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_and_alert_health_regression() FROM anon;
REVOKE EXECUTE ON FUNCTION public.detect_health_score_regression(numeric) FROM anon;
REVOKE EXECUTE ON FUNCTION public.compute_db_slo_for(date) FROM anon;
REVOKE EXECUTE ON FUNCTION public.persist_db_health_snapshot() FROM anon;
REVOKE EXECUTE ON FUNCTION public.persist_global_health_score() FROM anon;

-- === Garantir service_role em todas (para pg_cron/edge functions) ===
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef=true
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO service_role', r.proname, r.args);
  END LOOP;
END $$;

-- Nota: get_public_tracking(text) intencionalmente mantém anon (portal público de rastreamento).
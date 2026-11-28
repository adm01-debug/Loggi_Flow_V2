CREATE OR REPLACE FUNCTION public.auto_revert_ineffective_indexes(p_min_hours integer DEFAULT 24, p_min_improvement numeric DEFAULT 5)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'pg_catalog'
AS $function$
DECLARE
  r record;
  v_index_name text;
  v_reverted int := 0;
  v_errors int := 0;
  v_details jsonb := '[]'::jsonb;
  v_norm text;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;

  FOR r IN
    SELECT id, ddl, improvement_pct, applied_at, queryid
      FROM public.index_proposals
     WHERE status = 'applied'
       AND applied_at < now() - (p_min_hours || ' hours')::interval
       AND measured_at IS NOT NULL
       AND (improvement_pct IS NULL OR improvement_pct < p_min_improvement)
  LOOP
    -- extract index name from DDL: CREATE INDEX IF NOT EXISTS <name> ON ...
    v_norm := regexp_replace(lower(r.ddl), '\s+', ' ', 'g');
    v_index_name := (regexp_matches(v_norm, 'create index if not exists ([a-z0-9_]+) on'))[1];

    IF v_index_name IS NULL THEN
      v_errors := v_errors + 1;
      v_details := v_details || jsonb_build_object('id', r.id, 'status', 'skipped', 'reason', 'no_index_name');
      CONTINUE;
    END IF;

    BEGIN
      EXECUTE format('DROP INDEX IF EXISTS public.%I', v_index_name);
      UPDATE public.index_proposals
         SET status = 'reverted',
             reverted_at = now(),
             revert_reason = format('Ganho insuficiente: %s%% após %sh', COALESCE(r.improvement_pct::text,'n/a'), p_min_hours),
             updated_at = now()
       WHERE id = r.id;
      v_reverted := v_reverted + 1;
      v_details := v_details || jsonb_build_object('id', r.id, 'index', v_index_name, 'improvement_pct', r.improvement_pct);
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      v_details := v_details || jsonb_build_object('id', r.id, 'status', 'error', 'error', SQLERRM);
    END;
  END LOOP;

  IF v_reverted > 0 THEN
    INSERT INTO public.nexus_tactical_logs (module, level, message)
    VALUES ('INDEX_AUTO_REVERT', 'warn',
            format('Auto-revert removeu %s índice(s) ineficaz(es)', v_reverted));
  END IF;

  RETURN jsonb_build_object(
    'reverted', v_reverted,
    'errors', v_errors,
    'details', v_details,
    'checked_at', now()
  );
END; $function$

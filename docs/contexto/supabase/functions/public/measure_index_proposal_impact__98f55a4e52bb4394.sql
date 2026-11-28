CREATE OR REPLACE FUNCTION public.measure_index_proposal_impact(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'internal', 'public', 'extensions', 'pg_catalog'
AS $function$
DECLARE
  v_prop record;
  v_current double precision;
  v_improve numeric;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;

  SELECT * INTO v_prop FROM public.index_proposals WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'proposal not found';
  END IF;
  IF v_prop.status <> 'applied' THEN
    RAISE EXCEPTION 'proposal not yet applied';
  END IF;
  IF v_prop.queryid IS NULL THEN
    RAISE EXCEPTION 'proposal has no queryid to measure';
  END IF;

  EXECUTE 'SELECT mean_exec_time FROM extensions.pg_stat_statements WHERE queryid = $1 LIMIT 1'
    INTO v_current USING v_prop.queryid;

  IF v_current IS NULL THEN
    RETURN jsonb_build_object('status', 'no_data', 'queryid', v_prop.queryid);
  END IF;

  IF v_prop.baseline_mean_ms IS NULL OR v_prop.baseline_mean_ms = 0 THEN
    v_improve := NULL;
  ELSE
    v_improve := round(((v_prop.baseline_mean_ms - v_current) / v_prop.baseline_mean_ms * 100)::numeric, 2);
  END IF;

  UPDATE public.index_proposals
     SET post_apply_mean_ms = v_current,
         improvement_pct = v_improve,
         measured_at = now(),
         updated_at = now()
   WHERE id = p_id;

  RETURN jsonb_build_object(
    'status', 'measured',
    'baseline_ms', v_prop.baseline_mean_ms,
    'current_ms', v_current,
    'improvement_pct', v_improve
  );
END; $function$

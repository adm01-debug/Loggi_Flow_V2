CREATE OR REPLACE FUNCTION public.ensure_future_partitions()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_parent text;
  v_offset int;
  v_target date;
  v_created text[] := ARRAY[]::text[];
  v_parents text[] := ARRAY['rastreamento_historico','audit_logs'];
BEGIN
  FOREACH v_parent IN ARRAY v_parents LOOP
    FOR v_offset IN 0..5 LOOP
      v_target := (date_trunc('month', now()) + (v_offset || ' months')::interval)::date;
      BEGIN
        v_created := v_created || public.ensure_monthly_partition(
          v_parent,
          EXTRACT(YEAR FROM v_target)::int,
          EXTRACT(MONTH FROM v_target)::int
        );
      EXCEPTION WHEN OTHERS THEN
        CONTINUE;
      END;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'ok',
    'checked_at', now(),
    'partitions', to_jsonb(v_created)
  );
END;
$function$

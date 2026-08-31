
-- Drop legacy empty partitioned parent
DROP TABLE IF EXISTS public.audit_logs_old CASCADE;

-- Helper: create monthly partition if it does not exist
CREATE OR REPLACE FUNCTION public.ensure_monthly_partition(
  p_parent text,
  p_year int,
  p_month int
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_child text;
  v_start date;
  v_end date;
BEGIN
  v_start := make_date(p_year, p_month, 1);
  v_end := (v_start + INTERVAL '1 month')::date;
  v_child := format('%s_y%sm%s', p_parent, p_year, lpad(p_month::text, 2, '0'));

  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = v_child
  ) THEN
    EXECUTE format(
      'CREATE TABLE public.%I PARTITION OF public.%I FOR VALUES FROM (%L) TO (%L)',
      v_child, p_parent, v_start, v_end
    );
  END IF;

  RETURN v_child;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_monthly_partition(text,int,int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_monthly_partition(text,int,int) TO service_role;

-- Create missing partitions for rastreamento_historico (Jul/2026 -> Jun/2027)
DO $$
DECLARE
  m int;
  y int;
BEGIN
  FOR y, m IN
    SELECT 2026, generate_series(7,12)
    UNION ALL
    SELECT 2027, generate_series(1,6)
  LOOP
    BEGIN
      PERFORM public.ensure_monthly_partition('rastreamento_historico', y, m);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'skip rastreamento_historico %-%: %', y, m, SQLERRM;
    END;
  END LOOP;
END $$;

-- Create missing partitions for audit_logs (Jan/2027 -> Jun/2027)
DO $$
DECLARE
  m int;
BEGIN
  FOR m IN 1..6 LOOP
    BEGIN
      PERFORM public.ensure_monthly_partition('audit_logs', 2027, m);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'skip audit_logs 2027-%: %', m, SQLERRM;
    END;
  END LOOP;
END $$;

-- Orchestrator: creates the next 6 months of partitions for our partitioned tables
CREATE OR REPLACE FUNCTION public.ensure_future_partitions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
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
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_future_partitions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_future_partitions() TO service_role;

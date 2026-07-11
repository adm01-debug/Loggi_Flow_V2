
DO $$
DECLARE
  r record;
BEGIN
  -- rastreamento_historico partitions
  FOR r IN
    SELECT c.relname
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity
      AND c.relname LIKE 'rastreamento_historico_y%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
    EXECUTE format(
      'CREATE POLICY "Admins can view tracking history %s" ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role))',
      substring(r.relname from 'y\d{4}m\d{2}'), r.relname
    );
    EXECUTE format(
      'CREATE POLICY "Authenticated can insert tracking data" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)',
      r.relname
    );
  END LOOP;

  -- audit_logs partitions
  FOR r IN
    SELECT c.relname
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity
      AND c.relname LIKE 'audit_logs_y%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
  END LOOP;
END $$;

-- Update ensure_monthly_partition to auto-enable RLS on any future partition
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
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_child);

    IF p_parent = 'rastreamento_historico' THEN
      EXECUTE format(
        'CREATE POLICY "Admins can view tracking history y%sm%s" ON public.%I FOR SELECT TO authenticated USING (public.has_role(auth.uid(), ''admin''::app_role))',
        p_year, lpad(p_month::text,2,'0'), v_child
      );
      EXECUTE format(
        'CREATE POLICY "Authenticated can insert tracking data" ON public.%I FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL)',
        v_child
      );
    END IF;
  END IF;

  RETURN v_child;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ensure_monthly_partition(text,int,int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_monthly_partition(text,int,int) TO service_role;

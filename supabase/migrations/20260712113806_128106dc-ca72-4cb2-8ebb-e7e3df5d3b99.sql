-- Sprint 31 — Query performance baseline

CREATE TABLE IF NOT EXISTS internal.query_baseline (
  id bigserial PRIMARY KEY,
  captured_at timestamptz NOT NULL DEFAULT now(),
  queryid bigint NOT NULL,
  query_text text NOT NULL,
  calls bigint NOT NULL,
  total_exec_time double precision NOT NULL,
  mean_exec_time double precision NOT NULL,
  rows_processed bigint NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_query_baseline_captured_at ON internal.query_baseline(captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_baseline_queryid ON internal.query_baseline(queryid, captured_at DESC);

REVOKE ALL ON internal.query_baseline FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION internal.snapshot_query_baseline()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = internal, public, extensions, pg_catalog
AS $$
DECLARE inserted int := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_stat_statements') THEN
    RETURN jsonb_build_object('status','skipped','reason','pg_stat_statements not installed');
  END IF;

  EXECUTE $f$
    INSERT INTO internal.query_baseline(queryid, query_text, calls, total_exec_time, mean_exec_time, rows_processed)
    SELECT queryid, left(query,500), calls, total_exec_time, mean_exec_time, rows
    FROM extensions.pg_stat_statements
    WHERE query NOT LIKE '%pg_stat_statements%'
      AND query NOT LIKE '%internal.query_baseline%'
    ORDER BY total_exec_time DESC
    LIMIT 50
  $f$;
  GET DIAGNOSTICS inserted = ROW_COUNT;

  -- keep last 90 days
  DELETE FROM internal.query_baseline WHERE captured_at < now() - INTERVAL '90 days';

  RETURN jsonb_build_object('status','ok','inserted', inserted, 'ran_at', now());
END; $$;

REVOKE ALL ON FUNCTION internal.snapshot_query_baseline() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_query_regressions_fast()
RETURNS TABLE(queryid bigint, query_text text, baseline_mean_ms double precision, current_mean_ms double precision, regression_pct numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = internal, public, extensions, pg_catalog
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_stat_statements') THEN
    RETURN;
  END IF;

  RETURN QUERY EXECUTE $f$
    WITH latest AS (
      SELECT DISTINCT ON (queryid) queryid, query_text, mean_exec_time AS baseline
      FROM internal.query_baseline
      WHERE captured_at < now() - INTERVAL '1 day'
      ORDER BY queryid, captured_at DESC
    )
    SELECT s.queryid, left(s.query,500), l.baseline, s.mean_exec_time,
           round(((s.mean_exec_time - l.baseline) / NULLIF(l.baseline,0) * 100)::numeric, 2)
      FROM extensions.pg_stat_statements s
      JOIN latest l ON l.queryid = s.queryid
     WHERE s.mean_exec_time > l.baseline * 1.5
       AND s.calls > 10
     ORDER BY (s.mean_exec_time - l.baseline) DESC
     LIMIT 50
  $f$;
END; $$;

REVOKE ALL ON FUNCTION public.get_query_regressions_fast() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_query_regressions_fast() TO authenticated;

-- Cron diário 04:30 UTC
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    PERFORM cron.unschedule('snapshot-query-baseline-daily')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='snapshot-query-baseline-daily');
    PERFORM cron.schedule(
      'snapshot-query-baseline-daily',
      '30 4 * * *',
      $c$ SELECT internal.snapshot_query_baseline(); $c$
    );
  END IF;
END $$;
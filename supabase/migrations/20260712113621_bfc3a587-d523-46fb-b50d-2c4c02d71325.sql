-- Sprint 30 — REINDEX loop + agendamento semanal

CREATE OR REPLACE FUNCTION internal.reindex_hot_indexes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = internal, public, pg_catalog
AS $$
DECLARE
  r record;
  reindexed int := 0;
  started timestamptz := clock_timestamp();
BEGIN
  FOR r IN
    SELECT i.indexrelid::regclass::text AS idx
    FROM pg_index i
    JOIN pg_class c ON c.oid = i.indexrelid
    JOIN pg_class t ON t.oid = i.indrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_am am ON am.oid = c.relam
    WHERE n.nspname = 'public'
      AND am.amname = 'btree'
      AND t.relname IN ('entregas','coletas','notifications','user_sessions','fretes_internos','user_levels')
      AND NOT i.indisprimary
  LOOP
    BEGIN
      EXECUTE 'REINDEX INDEX ' || r.idx;
      reindexed := reindexed + 1;
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'status','ok',
    'reindexed_count', reindexed,
    'duration_ms', EXTRACT(MILLISECOND FROM (clock_timestamp() - started)),
    'ran_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION internal.reindex_hot_indexes() FROM PUBLIC, anon, authenticated;

-- Agenda semanal (domingo 05:00 UTC)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    PERFORM cron.unschedule('reindex-hot-indexes-weekly')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='reindex-hot-indexes-weekly');
    PERFORM cron.schedule(
      'reindex-hot-indexes-weekly',
      '0 5 * * 0',
      $c$ SELECT internal.reindex_hot_indexes(); $c$
    );
  END IF;
END $$;
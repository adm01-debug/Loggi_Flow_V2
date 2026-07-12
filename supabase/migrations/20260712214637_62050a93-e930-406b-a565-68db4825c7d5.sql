CREATE OR REPLACE FUNCTION public.get_wal_health()
RETURNS TABLE(
  db_size_bytes bigint,
  wal_size_bytes bigint,
  wal_to_db_ratio numeric,
  checkpoint_timeout_s integer,
  max_wal_size_mb integer,
  severity text,
  recommendation text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_db bigint;
  v_wal bigint;
  v_ratio numeric;
  v_ckpt integer;
  v_maxwal integer;
  v_sev text;
  v_reco text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  v_db := pg_database_size(current_database());

  -- WAL size (sum of files under pg_wal)
  SELECT COALESCE(sum((pg_stat_file('pg_wal/'||name, true)).size),0)::bigint
  INTO v_wal
  FROM pg_ls_waldir();

  v_ratio := CASE WHEN v_db>0 THEN round(v_wal::numeric / v_db, 2) ELSE 0 END;

  BEGIN v_ckpt := current_setting('checkpoint_timeout')::integer;
  EXCEPTION WHEN OTHERS THEN v_ckpt := NULL; END;

  BEGIN v_maxwal := (regexp_replace(current_setting('max_wal_size'),'[^0-9]','','g'))::integer;
  EXCEPTION WHEN OTHERS THEN v_maxwal := NULL; END;

  IF v_ratio > 10 THEN
    v_sev := 'critical';
    v_reco := 'WAL desproporcional (>10x do banco). Verificar replicação parada, slots inativos ou wal_keep_size excessivo.';
  ELSIF v_ratio > 5 THEN
    v_sev := 'warning';
    v_reco := 'WAL crescendo além do esperado (>5x). Monitorar checkpoint e slots de replicação.';
  ELSE
    v_sev := 'ok';
    v_reco := 'Razão WAL/DB dentro do esperado.';
  END IF;

  db_size_bytes := v_db;
  wal_size_bytes := v_wal;
  wal_to_db_ratio := v_ratio;
  checkpoint_timeout_s := v_ckpt;
  max_wal_size_mb := v_maxwal;
  severity := v_sev;
  recommendation := v_reco;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.get_wal_health() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_wal_health() TO authenticated, service_role;
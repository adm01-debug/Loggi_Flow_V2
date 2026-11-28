CREATE OR REPLACE FUNCTION public.get_wal_health()
 RETURNS TABLE(db_size_bytes bigint, wal_size_bytes bigint, wal_to_db_ratio numeric, checkpoint_timeout_s integer, max_wal_size_mb integer, severity text, recommendation text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
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

  BEGIN
    SELECT COALESCE(sum(w.size), 0)::bigint INTO v_wal FROM pg_ls_waldir() w;
  EXCEPTION WHEN OTHERS THEN
    v_wal := NULL;
  END;

  v_ratio := CASE WHEN v_wal IS NOT NULL AND v_db > 0
    THEN round(v_wal::numeric / v_db, 2) ELSE NULL END;

  BEGIN v_ckpt := current_setting('checkpoint_timeout')::integer;
  EXCEPTION WHEN OTHERS THEN v_ckpt := NULL; END;

  BEGIN v_maxwal := (regexp_replace(current_setting('max_wal_size'),'[^0-9]','','g'))::integer;
  EXCEPTION WHEN OTHERS THEN v_maxwal := NULL; END;

  IF v_ratio IS NULL THEN
    v_sev := 'unknown';
    v_reco := 'Tamanho do WAL indisponivel: o plano gerenciado nao expoe pg_ls_waldir/pg_stat_file a esta role.';
  ELSIF v_ratio > 10 THEN
    v_sev := 'critical';
    v_reco := 'WAL desproporcional (>10x do banco). Verificar replicacao parada, slots inativos ou wal_keep_size excessivo.';
  ELSIF v_ratio > 5 THEN
    v_sev := 'warning';
    v_reco := 'WAL crescendo alem do esperado (>5x). Monitorar checkpoint e slots de replicacao.';
  ELSE
    v_sev := 'ok';
    v_reco := 'Razao WAL/DB dentro do esperado.';
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
$function$

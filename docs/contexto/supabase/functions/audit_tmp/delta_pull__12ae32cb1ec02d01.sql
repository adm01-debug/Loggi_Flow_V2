CREATE OR REPLACE FUNCTION audit_tmp.delta_pull()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE r record; v_since text; n int := 0; BEGIN
  FOR r IN SELECT * FROM (VALUES ('public.rte_gateway_health','created_at'),('public.db_health_snapshots','created_at'),('public.audit_logs','created_at'),('public.rate_limit_logs','created_at'),('public.db_health_score_history','created_at'),('public.rte_slo_daily_snapshots','created_at'),('public.db_slo_daily','computed_at'),('public.contract_test_logs','created_at')) v(t, c) LOOP
    EXECUTE format('SELECT coalesce(max(%I), ''2026-01-01'')::text FROM %s', r.c, r.t) INTO v_since;
    INSERT INTO audit_tmp.req(name, request_id) VALUES ('d:'||r.t, audit_tmp.pull(format('select * from %s where %I > %L order by %I limit 5000', r.t, r.c, v_since, r.c))) ON CONFLICT (name) DO UPDATE SET request_id=EXCLUDED.request_id, created_at=now();
    n := n + 1;
  END LOOP; RETURN n; END $function$

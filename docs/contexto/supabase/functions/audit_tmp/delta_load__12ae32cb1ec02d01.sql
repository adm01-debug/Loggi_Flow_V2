CREATE OR REPLACE FUNCTION audit_tmp.delta_load()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE r record; v int; total int := 0; BEGIN
  FOR r IN SELECT q.name, substr(q.name,3) t, q.request_id FROM audit_tmp.req q WHERE q.name LIKE 'd:%' AND NOT EXISTS (SELECT 1 FROM audit_tmp.load_log l WHERE l.name = q.name||'#'||q.request_id) LOOP
    BEGIN v := audit_tmp.load(r.request_id, r.t::regclass); INSERT INTO audit_tmp.load_log(name, tbl, inserted) VALUES (r.name||'#'||r.request_id, r.t, v); total := total + v;
    EXCEPTION WHEN OTHERS THEN INSERT INTO audit_tmp.load_log(name, tbl, inserted, err) VALUES (r.name||'#'||r.request_id, r.t, NULL, SQLERRM); END;
  END LOOP; RETURN total; END $function$

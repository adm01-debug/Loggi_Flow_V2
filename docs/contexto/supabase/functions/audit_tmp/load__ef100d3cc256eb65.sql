CREATE OR REPLACE FUNCTION audit_tmp.load(p_request bigint, p_table regclass, p_conflict text DEFAULT NULL::text, p_upsert boolean DEFAULT false)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE v_cols text; v_set text; v_content jsonb; v_n int; v_st int; v_q text;
BEGIN
  SELECT r.status_code, r.content::jsonb INTO v_st, v_content FROM net._http_response r WHERE r.id=p_request;
  IF v_st IS NULL THEN RAISE EXCEPTION 'request % sem resposta ainda', p_request; END IF;
  IF v_st<>200 OR jsonb_typeof(v_content)<>'array' THEN RAISE EXCEPTION 'request % falhou: status %, %', p_request, v_st, left(v_content::text,300); END IF;
  SELECT string_agg(quote_ident(attname), ',' ORDER BY attnum),
         string_agg(quote_ident(attname)||'=EXCLUDED.'||quote_ident(attname), ',' ORDER BY attnum) FILTER (WHERE attname <> ALL(string_to_array(coalesce(p_conflict,''),',')))
    INTO v_cols, v_set FROM pg_attribute WHERE attrelid=p_table AND attnum>0 AND NOT attisdropped AND attgenerated='';
  v_q := format('INSERT INTO %s (%s) SELECT %s FROM jsonb_populate_recordset(NULL::%s, $1) ', p_table, v_cols, v_cols, p_table);
  IF p_upsert AND p_conflict IS NOT NULL THEN v_q := v_q || format('ON CONFLICT (%s) DO UPDATE SET %s', p_conflict, v_set);
  ELSE v_q := v_q || 'ON CONFLICT DO NOTHING'; END IF;
  EXECUTE v_q USING v_content; GET DIAGNOSTICS v_n = ROW_COUNT; RETURN v_n;
END $function$

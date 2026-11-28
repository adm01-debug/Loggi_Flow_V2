CREATE OR REPLACE FUNCTION audit_tmp.pull(p_sql text)
 RETURNS bigint
 LANGUAGE sql
AS $function$
  SELECT net.http_post(url := (SELECT v FROM audit_tmp.cfg WHERE k='src_url'),
    headers := jsonb_build_object('apikey', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='src_service_key'), 'Authorization', 'Bearer '||(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='src_service_key'), 'Content-Type','application/json'),
    body := jsonb_build_object('query', p_sql), timeout_milliseconds := 120000);
$function$

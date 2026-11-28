CREATE OR REPLACE FUNCTION public.apply_index_proposal(p_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_prop record;
  v_normalized text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'access denied: admin role required';
  END IF;

  SELECT * INTO v_prop FROM public.index_proposals WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'proposal not found';
  END IF;

  IF v_prop.status = 'applied' THEN
    RETURN jsonb_build_object('status', 'already_applied');
  END IF;

  -- Validação estrita do DDL: deve começar com CREATE INDEX IF NOT EXISTS
  v_normalized := regexp_replace(lower(trim(v_prop.ddl)), '\s+', ' ', 'g');
  IF v_normalized !~ '^create index if not exists [a-z_][a-z0-9_]* on [a-z_][a-z0-9_\.]* \([a-z0-9_, ]+\);?$' THEN
    UPDATE public.index_proposals
       SET status = 'failed',
           error_message = 'DDL rejeitado pelo validador de whitelist',
           updated_at = now()
     WHERE id = p_id;
    RAISE EXCEPTION 'DDL não passou na whitelist de segurança';
  END IF;

  -- Bloqueia palavras perigosas por segurança extra
  IF v_normalized ~ '(drop|delete|update|insert|alter|truncate|grant|revoke|;.*[a-z])' THEN
    UPDATE public.index_proposals
       SET status = 'failed',
           error_message = 'DDL contém tokens não permitidos',
           updated_at = now()
     WHERE id = p_id;
    RAISE EXCEPTION 'DDL contém comandos não permitidos';
  END IF;

  BEGIN
    EXECUTE v_prop.ddl;
    UPDATE public.index_proposals
       SET status = 'applied',
           applied_by = auth.uid(),
           applied_at = now(),
           updated_at = now()
     WHERE id = p_id;
    RETURN jsonb_build_object('status', 'applied', 'ddl', v_prop.ddl);
  EXCEPTION WHEN OTHERS THEN
    UPDATE public.index_proposals
       SET status = 'failed',
           error_message = SQLERRM,
           updated_at = now()
     WHERE id = p_id;
    RAISE;
  END;
END; $function$

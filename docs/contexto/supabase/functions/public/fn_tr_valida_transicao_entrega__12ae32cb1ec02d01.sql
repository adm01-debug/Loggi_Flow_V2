CREATE OR REPLACE FUNCTION public.fn_tr_valida_transicao_entrega()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.fn_valida_transicao_entrega(OLD.status, NEW.status) THEN
    RAISE EXCEPTION 'Transição de status inválida: % -> %', OLD.status, NEW.status
      USING ERRCODE = '23514';
  END IF;

  IF NEW.status = 'despachado' AND coalesce(NEW.nf_remessa, '') = '' THEN
    RAISE EXCEPTION 'NF de simples remessa obrigatória para despachar: preencha nf_remessa antes de mudar o status para despachado.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$

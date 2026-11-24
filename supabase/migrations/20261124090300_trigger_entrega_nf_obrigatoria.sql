-- Etapa 031 (achado C-01): "nao despacha sem nota fiscal" sai da tela e passa a valer no banco.
-- Antes: src/pages/Despachos.tsx bloqueava o clique; PATCH direto ou outra tela gravava despachado
-- sem nf_remessa — e e essa data que alimenta os paineis de SLA e OTIF.
-- Vazio-string e tao invalido quanto nulo. A regra olha apenas a ENTRADA em despachado, portanto
-- entregas antigas sem NF continuam podendo avancar de despachado para em_transito (passivo registrado
-- no corpo da PR, nao corrigido aqui).

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
$function$;

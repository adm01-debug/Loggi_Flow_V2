CREATE OR REPLACE FUNCTION public.fn_valida_transicao_entrega(p_de entrega_status, p_para entrega_status)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  -- update que nao muda o status nao e transicao
  IF p_de = p_para THEN
    RETURN true;
  END IF;

  RETURN CASE p_de
    WHEN 'aguardando_producao' THEN p_para = 'pronto_despacho'
    WHEN 'pronto_despacho'     THEN p_para = 'cotacao_frete'
    WHEN 'cotacao_frete'       THEN p_para = 'nf_emitida'
    WHEN 'nf_emitida'          THEN p_para = 'despachado'
    WHEN 'despachado'          THEN p_para IN ('em_transito', 'saiu_entrega', 'entregue', 'ocorrencia')
    WHEN 'em_transito'         THEN p_para IN ('saiu_entrega', 'entregue', 'ocorrencia')
    WHEN 'saiu_entrega'        THEN p_para IN ('entregue', 'ocorrencia', 'em_transito')
    WHEN 'entregue'            THEN p_para = 'finalizado'
    WHEN 'ocorrencia'          THEN p_para IN ('em_transito', 'saiu_entrega', 'entregue', 'finalizado')
    ELSE false
  END;
END;
$function$

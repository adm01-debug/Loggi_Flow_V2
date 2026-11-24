-- Etapa 028 (achado C-01): leva para o banco a ordem valida dos status de entrega.
-- Antes desta migration a unica validacao era o mapa do front (src/lib/statusTransitions.ts);
-- um PATCH direto na API gravava "entregue" numa entrega que nunca foi despachada.
-- O mapa abaixo espelha TRANSICOES_ENTREGA e aceita os saltos que as integracoes ja praticam hoje
-- (transportadoras pulam etapas e reenviam evento fora de ordem): despachado -> saiu_entrega/entregue,
-- em_transito -> entregue, saiu_entrega -> em_transito e ocorrencia a partir de despachado/em_transito.
-- Sem trigger: nada chama esta funcao ainda (o trigger e a etapa 029).

CREATE OR REPLACE FUNCTION public.fn_valida_transicao_entrega(
  p_de public.entrega_status,
  p_para public.entrega_status
)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SECURITY DEFINER
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
$function$;

COMMENT ON FUNCTION public.fn_valida_transicao_entrega(public.entrega_status, public.entrega_status)
  IS 'Etapa 028/C-01: true quando a mudanca de status de entrega respeita a ordem do fluxo; p_de = p_para e valido.';

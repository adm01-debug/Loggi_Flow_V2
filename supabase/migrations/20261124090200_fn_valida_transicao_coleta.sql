-- Etapa 030 (achado C-01): mesma protecao para coletas, que nunca tiveram nem a validacao de tela.
-- Mapa espelha TRANSICOES_COLETA (src/lib/statusTransitions.ts) e aceita solicitada -> chegou_expedicao
-- porque supabase/functions/lalamove-webhook/index.ts grava chegou_expedicao quando o pedido e concluido,
-- sem passar por em_transito. Funcao propria por enum (ver a etapa 030: nao reaproveitar a de entregas).

CREATE OR REPLACE FUNCTION public.fn_valida_transicao_coleta(
  p_de public.coleta_status,
  p_para public.coleta_status
)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF p_de = p_para THEN
    RETURN true;
  END IF;

  RETURN CASE p_de
    WHEN 'aguardando_liberacao' THEN p_para = 'solicitada'
    WHEN 'solicitada'           THEN p_para IN ('em_transito', 'chegou_expedicao')
    WHEN 'em_transito'          THEN p_para = 'chegou_expedicao'
    WHEN 'chegou_expedicao'     THEN p_para IN ('conferencia_ok', 'divergencia')
    WHEN 'conferencia_ok'       THEN p_para = 'finalizada'
    WHEN 'divergencia'          THEN p_para IN ('conferencia_ok', 'finalizada')
    ELSE false
  END;
END;
$function$;

COMMENT ON FUNCTION public.fn_valida_transicao_coleta(public.coleta_status, public.coleta_status)
  IS 'Etapa 030/C-01: true quando a mudanca de status de coleta respeita a ordem do fluxo; p_de = p_para e valido.';

CREATE OR REPLACE FUNCTION public.fn_tr_valida_transicao_coleta()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NOT public.fn_valida_transicao_coleta(OLD.status, NEW.status) THEN
    RAISE EXCEPTION 'Transição de status inválida: % -> %', OLD.status, NEW.status
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS a_valida_transicao_coletas ON public.coletas;
CREATE TRIGGER a_valida_transicao_coletas
  BEFORE UPDATE OF status ON public.coletas
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.fn_tr_valida_transicao_coleta();

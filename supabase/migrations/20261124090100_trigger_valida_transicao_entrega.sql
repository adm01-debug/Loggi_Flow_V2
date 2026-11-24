-- Etapa 029 (achado C-01): trigger BEFORE UPDATE em entregas que recusa transicao fora do mapa da 028.
-- Nome comecando em "a_" de proposito: o Postgres executa triggers BEFORE em ordem alfabetica de nome,
-- e assim este roda antes dos triggers de auditoria/versao — tentativa recusada nao vira registro de mudanca.
-- SQLSTATE 23514 e a mensagem "Transição de status inválida: X -> Y" sao o formato que
-- src/lib/statusTransitions.ts ja traduz para o operador (etapa 037).

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
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS a_valida_transicao_entregas ON public.entregas;
CREATE TRIGGER a_valida_transicao_entregas
  BEFORE UPDATE OF status ON public.entregas
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION public.fn_tr_valida_transicao_entrega();

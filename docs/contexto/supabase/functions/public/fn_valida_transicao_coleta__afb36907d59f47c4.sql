CREATE OR REPLACE FUNCTION public.fn_valida_transicao_coleta(p_de coleta_status, p_para coleta_status)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
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
$function$

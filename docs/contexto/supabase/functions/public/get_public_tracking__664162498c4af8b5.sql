CREATE OR REPLACE FUNCTION public.get_public_tracking(p_code text)
 RETURNS TABLE(numero_entrega text, status entrega_status, codigo_rastreamento text, nf_remessa text, previsao_entrega timestamp with time zone, data_despacho timestamp with time zone, data_entrega_efetiva timestamp with time zone, recebedor text, created_at timestamp with time zone, updated_at timestamp with time zone, endereco_entrega text, comprovante_entrega_url text, cliente_razao_social text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    e.numero_entrega,
    e.status,
    e.codigo_rastreamento,
    e.nf_remessa,
    e.previsao_entrega,
    e.data_despacho,
    e.data_entrega_efetiva,
    e.recebedor,
    e.created_at,
    e.updated_at,
    e.endereco_entrega,
    e.comprovante_entrega_url,
    c.razao_social as cliente_razao_social
  FROM public.entregas e
  LEFT JOIN public.clientes c ON e.cliente_id = c.id
  WHERE (e.codigo_rastreamento = p_code OR e.nf_remessa = p_code OR e.numero_entrega = p_code)
    AND e.deleted_at IS NULL
  ORDER BY e.updated_at DESC NULLS LAST, e.created_at DESC
  LIMIT 1;
END;
$function$

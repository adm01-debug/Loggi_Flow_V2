CREATE OR REPLACE FUNCTION public.get_carrier_performance_stats()
 RETURNS TABLE(transportadora_id uuid, nome_fantasia text, total_entregas bigint, entregas_no_prazo bigint, otif_percent numeric, tempo_medio_coleta_horas numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH stats AS (
    SELECT 
      e.transportadora_id,
      t.nome_fantasia,
      COUNT(e.id) as total,
      COUNT(e.id) FILTER (WHERE e.data_entrega_efetiva <= e.previsao_entrega) as no_prazo
    FROM entregas e
    JOIN transportadoras t ON e.transportadora_id = t.id
    WHERE e.status = 'entregue'
    GROUP BY e.transportadora_id, t.nome_fantasia
  )
  SELECT 
    s.transportadora_id,
    s.nome_fantasia,
    s.total,
    s.no_prazo,
    CASE WHEN s.total > 0 THEN (s.no_prazo::numeric / s.total::numeric * 100) ELSE 0 END,
    NULL::numeric
  FROM stats s;
END;
$function$

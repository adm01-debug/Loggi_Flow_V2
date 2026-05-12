CREATE OR REPLACE FUNCTION public.get_carrier_performance_stats()
RETURNS TABLE (
  transportadora_id UUID,
  nome_fantasia TEXT,
  total_entregas BIGINT,
  entregas_no_prazo BIGINT,
  otif_percent NUMERIC,
  tempo_medio_coleta_horas NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
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
    CASE WHEN s.total > 0 THEN (s.no_prazo::numeric / s.total::numeric * 100) ELSE 0 END as otif_percent,
    NULL::numeric as tempo_medio_coleta_horas -- Placeholder for now
  FROM stats s;
END;
$$;
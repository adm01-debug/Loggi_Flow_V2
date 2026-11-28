CREATE OR REPLACE FUNCTION public.get_monthly_analytics(start_date timestamp with time zone, end_date timestamp with time zone)
 RETURNS TABLE(month_label text, entregas_count bigint, coletas_count bigint, custo_total numeric, sla_atingido integer, ocorrencias_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    WITH months AS (
        SELECT generate_series(
            date_trunc('month', start_date),
            date_trunc('month', end_date),
            '1 month'::interval
        ) AS month_start
    ),
    stats AS (
        SELECT
            m.month_start,
            to_char(m.month_start, 'Mon YYYY') as m_label,
            (SELECT count(*) FROM public.entregas e WHERE e.created_at >= m.month_start AND e.created_at < m.month_start + '1 month'::interval) as e_count,
            (SELECT count(*) FROM public.coletas c WHERE c.created_at >= m.month_start AND c.created_at < m.month_start + '1 month'::interval) as c_count,
            (SELECT coalesce(sum(valor_frete), 0) FROM public.entregas e WHERE e.created_at >= m.month_start AND e.created_at < m.month_start + '1 month'::interval) as total_cost,
            (SELECT count(*) FROM public.ocorrencias o WHERE o.created_at >= m.month_start AND o.created_at < m.month_start + '1 month'::interval) as o_count,
            (
                WITH month_entregas AS (
                    SELECT previsao_entrega, data_entrega_efetiva
                    FROM public.entregas
                    WHERE created_at >= m.month_start 
                    AND created_at < m.month_start + '1 month'::interval
                    AND status = 'entregue'
                ),
                delivered_on_time AS (
                    SELECT count(*) as count
                    FROM month_entregas
                    WHERE previsao_entrega IS NOT NULL 
                    AND data_entrega_efetiva IS NOT NULL 
                    AND data_entrega_efetiva <= previsao_entrega
                )
                SELECT 
                    CASE 
                        WHEN (SELECT count(*) FROM month_entregas) = 0 THEN 100 
                        ELSE (SELECT count * 100 / (SELECT count(*) FROM month_entregas) FROM delivered_on_time) 
                    END
            ) as sla
        FROM months m
    )
    SELECT m_label, e_count, c_count, total_cost, sla::integer, o_count
    FROM stats
    ORDER BY month_start;
END;
$function$

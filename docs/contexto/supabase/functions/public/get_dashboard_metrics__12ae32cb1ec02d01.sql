CREATE OR REPLACE FUNCTION public.get_dashboard_metrics()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    result json;
    total_coletas int;
    coletas_pendentes int;
    coletas_transito int;
    coletas_finalizadas int;
    coletas_divergencia int;
    total_entregas int;
    entregas_pendentes int;
    entregas_transito int;
    entregas_finalizadas int;
    entregas_ocorrencia int;
    otif_count int;
    total_volume bigint;
    total_frete numeric;
BEGIN
    -- Coletas
    SELECT count(*), 
           count(*) FILTER (WHERE status IN ('aguardando_liberacao', 'solicitada')),
           count(*) FILTER (WHERE status = 'em_transito'),
           count(*) FILTER (WHERE status = 'finalizada'),
           count(*) FILTER (WHERE divergencia_percentual > 5),
           COALESCE(sum(qtd_volumes), 0)
    INTO total_coletas, coletas_pendentes, coletas_transito, coletas_finalizadas, coletas_divergencia, total_volume
    FROM public.coletas;

    -- Entregas
    SELECT count(*),
           count(*) FILTER (WHERE status IN ('aguardando_producao', 'pronto_despacho', 'cotacao_frete', 'nf_emitida')),
           count(*) FILTER (WHERE status IN ('despachado', 'em_transito', 'saiu_entrega')),
           count(*) FILTER (WHERE status IN ('entregue', 'finalizado')),
           count(*) FILTER (WHERE status = 'ocorrencia'),
           COALESCE(sum(valor_frete), 0)
    INTO total_entregas, entregas_pendentes, entregas_transito, entregas_finalizadas, entregas_ocorrencia, total_frete
    FROM public.entregas;

    -- OTIF: No prazo e sem ocorrência
    SELECT count(*)
    INTO otif_count
    FROM public.entregas
    WHERE data_entrega_efetiva <= previsao_entrega 
    AND status != 'ocorrencia';

    SELECT json_build_object(
        'totalColetas', total_coletas,
        'coletasPendentes', coletas_pendentes,
        'coletasEmTransito', coletas_transito,
        'coletasFinalizadas', coletas_finalizadas,
        'coletasComDivergencia', coletas_divergencia,
        'totalEntregas', total_entregas,
        'entregasPendentes', entregas_pendentes,
        'entregasEmTransito', entregas_transito,
        'entregasFinalizadas', entregas_finalizadas,
        'entregasComOcorrencia', entregas_ocorrencia,
        'otifRate', CASE WHEN total_entregas > 0 THEN (otif_count::numeric / total_entregas) * 100 ELSE 100 END,
        'totalVolume', total_volume,
        'valorTotalFrete', total_frete,
        'lastSync', now()
    ) INTO result;

    RETURN result;
END;
$function$

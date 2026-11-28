CREATE OR REPLACE FUNCTION public.update_carrier_ranking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_transportadora_id UUID;
    v_total_shipments INTEGER;
    v_on_time_shipments INTEGER;
    v_sla_percentage NUMERIC;
    v_rank_tier TEXT;
BEGIN
    v_transportadora_id := NEW.transportadora_id;
    
    IF v_transportadora_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Calculate stats
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE data_entrega_efetiva <= previsao_entrega)
    INTO v_total_shipments, v_on_time_shipments
    FROM public.entregas
    WHERE transportadora_id = v_transportadora_id
    AND status IN ('entregue', 'finalizado');

    IF v_total_shipments > 0 THEN
        v_sla_percentage := (v_on_time_shipments::NUMERIC / v_total_shipments::NUMERIC) * 100;
    ELSE
        v_sla_percentage := 0;
    END IF;

    -- Determine rank tier
    IF v_sla_percentage >= 98 AND v_total_shipments >= 50 THEN
        v_rank_tier := 'diamond';
    ELSIF v_sla_percentage >= 95 AND v_total_shipments >= 30 THEN
        v_rank_tier := 'platinum';
    ELSIF v_sla_percentage >= 90 AND v_total_shipments >= 15 THEN
        v_rank_tier := 'gold';
    ELSIF v_sla_percentage >= 80 THEN
        v_rank_tier := 'silver';
    ELSE
        v_rank_tier := 'bronze';
    END IF;

    -- Upsert ranking
    INSERT INTO public.carrier_rankings (transportadora_id, period, total_shipments, on_time_shipments, sla_percentage, rank_tier, last_updated)
    VALUES (v_transportadora_id, 'all_time', v_total_shipments, v_on_time_shipments, v_sla_percentage, v_rank_tier, now())
    ON CONFLICT (transportadora_id, period) DO UPDATE SET
        total_shipments = EXCLUDED.total_shipments,
        on_time_shipments = EXCLUDED.on_time_shipments,
        sla_percentage = EXCLUDED.sla_percentage,
        rank_tier = EXCLUDED.rank_tier,
        last_updated = now();

    RETURN NEW;
END;
$function$

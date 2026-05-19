-- Driver Badges Table
CREATE TABLE public.driver_badges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Carrier Rankings Table
CREATE TABLE public.carrier_rankings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    transportadora_id UUID NOT NULL REFERENCES public.transportadoras(id) ON DELETE CASCADE,
    period TEXT NOT NULL, -- 'monthly', 'quarterly', 'yearly', 'all_time'
    total_shipments INTEGER DEFAULT 0,
    on_time_shipments INTEGER DEFAULT 0,
    sla_percentage NUMERIC(5,2) DEFAULT 0.00,
    efficiency_score NUMERIC(5,2) DEFAULT 0.00,
    rank_tier TEXT DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum', 'diamond'
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(transportadora_id, period)
);

-- Enable RLS
ALTER TABLE public.driver_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_rankings ENABLE ROW LEVEL SECURITY;

-- Policies for Driver Badges
CREATE POLICY "Drivers can view their own badges" 
ON public.driver_badges 
FOR SELECT 
USING (auth.uid() = driver_id);

CREATE POLICY "Admins can manage driver badges" 
ON public.driver_badges 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND cargo = 'admin'
    )
);

-- Policies for Carrier Rankings
CREATE POLICY "All users can view carrier rankings" 
ON public.carrier_rankings 
FOR SELECT 
USING (true);

-- Function to update carrier ranking
CREATE OR REPLACE FUNCTION public.update_carrier_ranking()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for entregas status update
CREATE TRIGGER trigger_update_carrier_ranking
AFTER UPDATE OF status ON public.entregas
FOR EACH ROW
WHEN (NEW.status IN ('entregue', 'finalizado'))
EXECUTE FUNCTION public.update_carrier_ranking();

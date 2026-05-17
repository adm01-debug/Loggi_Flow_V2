ALTER TABLE public.freight_selection_rules ADD COLUMN IF NOT EXISTS performance_weight NUMERIC DEFAULT 0.2;
ALTER TABLE public.freight_selection_rules ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

-- Clean up and insert defaults
DELETE FROM public.freight_selection_rules;

INSERT INTO public.freight_selection_rules (event_type, max_sla_days, price_weight, time_weight, performance_weight, is_default, is_active)
VALUES 
('Normal', 15, 0.7, 0.2, 0.1, true, true),
('Urgente', 5, 0.2, 0.6, 0.2, false, true),
('Evento', 10, 0.4, 0.4, 0.2, false, true);

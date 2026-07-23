
CREATE TABLE IF NOT EXISTS public.delay_predictions_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('entrega', 'coleta')),
  entity_numero TEXT,
  risco TEXT NOT NULL CHECK (risco IN ('baixo', 'medio', 'alto', 'critico')),
  probabilidade_atraso INTEGER NOT NULL CHECK (probabilidade_atraso >= 0 AND probabilidade_atraso <= 100),
  horas_estimadas_atraso NUMERIC(6,2) NOT NULL DEFAULT 0,
  motivos JSONB NOT NULL DEFAULT '[]'::jsonb,
  recomendacoes JSONB NOT NULL DEFAULT '[]'::jsonb,
  fatores JSONB NOT NULL DEFAULT '[]'::jsonb,
  predicted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  was_accurate BOOLEAN,
  actual_delay_hours NUMERIC(6,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.delay_predictions_history TO authenticated;
GRANT ALL ON public.delay_predictions_history TO service_role;

ALTER TABLE public.delay_predictions_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_read_all_predictions"
  ON public.delay_predictions_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admin_full_access_predictions"
  ON public.delay_predictions_history FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "service_role_all_predictions"
  ON public.delay_predictions_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_dph_entity ON public.delay_predictions_history (entity_id, predicted_at DESC);
CREATE INDEX IF NOT EXISTS idx_dph_predicted_at ON public.delay_predictions_history (predicted_at DESC);
CREATE INDEX IF NOT EXISTS idx_dph_risco ON public.delay_predictions_history (risco);
CREATE INDEX IF NOT EXISTS idx_dph_unconfirmed ON public.delay_predictions_history (entity_id) WHERE confirmed_at IS NULL;

CREATE OR REPLACE FUNCTION public.cleanup_old_delay_predictions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.delay_predictions_history
  WHERE predicted_at < now() - INTERVAL '90 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_predictions_accurate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actual_delay_hours NUMERIC(6,2);
BEGIN
  IF NEW.data_entrega_efetiva IS NOT NULL
     AND (OLD.data_entrega_efetiva IS NULL OR OLD.data_entrega_efetiva IS DISTINCT FROM NEW.data_entrega_efetiva)
     AND NEW.previsao_entrega IS NOT NULL THEN

    v_actual_delay_hours := GREATEST(0, EXTRACT(EPOCH FROM (NEW.data_entrega_efetiva - NEW.previsao_entrega)) / 3600.0);

    UPDATE public.delay_predictions_history
       SET confirmed_at = now(),
           actual_delay_hours = v_actual_delay_hours,
           was_accurate = (ABS(horas_estimadas_atraso - v_actual_delay_hours) <= 2)
     WHERE entity_id = NEW.id
       AND entity_type = 'entrega'
       AND confirmed_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_entregas_prediction_feedback ON public.entregas;
CREATE TRIGGER trg_entregas_prediction_feedback
AFTER UPDATE OF data_entrega_efetiva ON public.entregas
FOR EACH ROW
EXECUTE FUNCTION public.mark_predictions_accurate();

CREATE OR REPLACE VIEW public.v_prediction_accuracy AS
SELECT
  date_trunc('day', predicted_at)::date AS dia,
  risco,
  COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL) AS total_confirmadas,
  COUNT(*) FILTER (WHERE was_accurate = true) AS total_acertos,
  ROUND(
    (COUNT(*) FILTER (WHERE was_accurate = true)::numeric
     / NULLIF(COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL), 0)) * 100,
    2
  ) AS acuracia_percentual,
  COUNT(*) AS total_predicoes
FROM public.delay_predictions_history
GROUP BY 1, 2;

GRANT SELECT ON public.v_prediction_accuracy TO authenticated;

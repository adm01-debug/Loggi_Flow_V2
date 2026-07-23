
CREATE TABLE public.prediction_accuracy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transportadora TEXT,
  target_pct NUMERIC NOT NULL DEFAULT 80 CHECK (target_pct >= 0 AND target_pct <= 100),
  consecutive_days_alert INTEGER NOT NULL DEFAULT 3 CHECK (consecutive_days_alert >= 1 AND consecutive_days_alert <= 30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, transportadora)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prediction_accuracy_settings TO authenticated;
GRANT ALL ON public.prediction_accuracy_settings TO service_role;

ALTER TABLE public.prediction_accuracy_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own accuracy settings"
ON public.prediction_accuracy_settings
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_prediction_accuracy_settings_updated_at
BEFORE UPDATE ON public.prediction_accuracy_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.count_prediction_breach_days(
  _target NUMERIC,
  _carrier TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH daily AS (
    SELECT
      date_trunc('day', created_at)::date AS d,
      AVG(CASE WHEN was_accurate THEN 100.0 ELSE 0.0 END) AS acc_pct
    FROM public.delay_predictions_history
    WHERE was_accurate IS NOT NULL
      AND created_at >= now() - INTERVAL '30 days'
      AND (_carrier IS NULL OR transportadora = _carrier)
    GROUP BY 1
    ORDER BY 1 DESC
  ), streak AS (
    SELECT d, acc_pct,
      ROW_NUMBER() OVER (ORDER BY d DESC) AS rn,
      (acc_pct < _target) AS is_breach
    FROM daily
  )
  SELECT COALESCE(
    (SELECT MIN(rn) - 1 FROM streak WHERE NOT is_breach),
    (SELECT COUNT(*)::int FROM streak)
  );
$$;

GRANT EXECUTE ON FUNCTION public.count_prediction_breach_days(NUMERIC, TEXT) TO authenticated, service_role;


CREATE OR REPLACE FUNCTION public.detect_health_score_regression(p_threshold numeric DEFAULT 10)
RETURNS TABLE(
  current_score numeric,
  previous_score numeric,
  delta numeric,
  regression_detected boolean,
  current_at timestamptz,
  previous_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_curr record;
  v_prev record;
  v_delta numeric;
BEGIN
  SELECT overall_score, captured_at INTO v_curr
    FROM public.db_health_score_history
   ORDER BY captured_at DESC LIMIT 1;

  SELECT overall_score, captured_at INTO v_prev
    FROM public.db_health_score_history
   WHERE captured_at <= (v_curr.captured_at - interval '20 hours')
   ORDER BY captured_at DESC LIMIT 1;

  IF v_curr IS NULL OR v_prev IS NULL THEN
    RETURN;
  END IF;

  v_delta := v_curr.overall_score - v_prev.overall_score;
  RETURN QUERY SELECT
    v_curr.overall_score,
    v_prev.overall_score,
    ROUND(v_delta, 2),
    (v_delta <= -p_threshold),
    v_curr.captured_at,
    v_prev.captured_at;
END; $$;

-- Job de verificação: registra alerta se houve regressão
CREATE OR REPLACE FUNCTION public.check_and_alert_health_regression()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  r record;
  v_msg text;
BEGIN
  SELECT * INTO r FROM public.detect_health_score_regression(10);
  IF r IS NULL OR NOT r.regression_detected THEN
    RETURN jsonb_build_object('alerted', false);
  END IF;

  -- Evita duplicar alerta na mesma hora
  IF EXISTS (
    SELECT 1 FROM public.nexus_tactical_logs
     WHERE module = 'HEALTH_SCORE'
       AND created_at > now() - interval '1 hour'
       AND message LIKE 'Regressão de saúde detectada%'
  ) THEN
    RETURN jsonb_build_object('alerted', false, 'reason', 'already_alerted_recently');
  END IF;

  v_msg := format(
    'Regressão de saúde detectada: score caiu %s pontos em ~24h (%s → %s)',
    ROUND(ABS(r.delta), 1), r.previous_score, r.current_score
  );

  INSERT INTO public.nexus_tactical_logs (module, level, message)
  VALUES ('HEALTH_SCORE', 'crit', v_msg);

  -- Notifica admins in-app
  INSERT INTO public.notifications (user_id, title, message, type, action_url, metadata)
  SELECT DISTINCT ur.user_id,
    'Regressão de Saúde do Banco ⚠️',
    v_msg,
    'error',
    '/admin/db-health',
    jsonb_build_object(
      'event', 'health_score_regression',
      'delta', r.delta,
      'current_score', r.current_score,
      'previous_score', r.previous_score
    )
  FROM public.user_roles ur WHERE ur.role = 'admin';

  RETURN jsonb_build_object(
    'alerted', true,
    'delta', r.delta,
    'current', r.current_score,
    'previous', r.previous_score
  );
END; $$;

-- Cron horário
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    PERFORM cron.unschedule('check-health-score-regression-hourly')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='check-health-score-regression-hourly');
    PERFORM cron.schedule(
      'check-health-score-regression-hourly',
      '15 * * * *',
      $c$ SELECT public.check_and_alert_health_regression(); $c$
    );
  END IF;
END $$;

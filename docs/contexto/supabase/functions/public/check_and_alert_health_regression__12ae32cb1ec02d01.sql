CREATE OR REPLACE FUNCTION public.check_and_alert_health_regression()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
END; $function$


DO $$
DECLARE
  partition_name TEXT;
BEGIN
  FOR partition_name IN
    SELECT c.relname FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public'
      AND c.relname LIKE 'audit_logs_y%'
      AND c.relkind IN ('r','p')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Admins view audit partition" ON public.%I', partition_name);
    EXECUTE format(
      'CREATE POLICY "Admins view audit partition" ON public.%I FOR SELECT USING (public.has_role(auth.uid(), ''admin''::app_role))',
      partition_name
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.cleanup_old_telemetry_logs()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    DELETE FROM public.telemetry_logs
    WHERE created_at < now() - INTERVAL '30 days';
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_carrier_performance_stats()
 RETURNS TABLE(transportadora_id uuid, nome_fantasia text, total_entregas bigint, entregas_no_prazo bigint, otif_percent numeric, tempo_medio_coleta_horas numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    CASE WHEN s.total > 0 THEN (s.no_prazo::numeric / s.total::numeric * 100) ELSE 0 END,
    NULL::numeric
  FROM stats s;
END;
$function$;

DROP POLICY IF EXISTS "System can manage lockouts" ON public.account_lockouts;
CREATE POLICY "Admins can manage lockouts" ON public.account_lockouts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "System can manage verification tokens" ON public.email_verification_tokens;
CREATE POLICY "Admins can manage verification tokens" ON public.email_verification_tokens
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Service role manages registration challenges" ON public.webauthn_challenges;
CREATE POLICY "Admins manage registration challenges" ON public.webauthn_challenges
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Public webhook processing access" ON public.webhook_events_processed;
CREATE POLICY "Admins read webhook processing" ON public.webhook_events_processed
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

REVOKE EXECUTE ON FUNCTION public.add_user_xp(uuid, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.calculate_level(integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_telemetry_logs() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_carrier_performance_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_leaderboard(integer, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_permissions(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.purchase_reward(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_user_streak(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.xp_for_level(integer) FROM anon;

DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars readable by authenticated"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

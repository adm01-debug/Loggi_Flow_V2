
CREATE INDEX IF NOT EXISTS idx_entregas_status_active
  ON public.entregas(status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_coletas_status_active
  ON public.coletas(status);

CREATE INDEX IF NOT EXISTS idx_entregas_previsao_active
  ON public.entregas(previsao_entrega)
  WHERE status NOT IN ('entregue','finalizado') AND deleted_at IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='freight_webhooks' AND column_name='cliente_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_freight_webhooks_cliente_id ON public.freight_webhooks(cliente_id)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='delivery_receipt_audit' AND column_name='entrega_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_delivery_receipt_audit_entrega_id ON public.delivery_receipt_audit(entrega_id)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='delivery_receipt_audit' AND column_name='user_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_delivery_receipt_audit_user_id ON public.delivery_receipt_audit(user_id)';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.xp_for_level(lvl integer)
RETURNS integer LANGUAGE sql IMMUTABLE SECURITY INVOKER
SET search_path = public
AS $$ SELECT (lvl - 1) * (lvl - 1) * 100 $$;

CREATE OR REPLACE FUNCTION public.calculate_level(xp integer)
RETURNS integer LANGUAGE sql IMMUTABLE SECURITY INVOKER
SET search_path = public
AS $$ SELECT GREATEST(1, FLOOR(SQRT(xp / 100.0))::int + 1) $$;

DO $$
DECLARE
  fn text;
  internal_functions text[] := ARRAY[
    'update_user_rank()','handle_new_user_levels()','handle_new_user()',
    'trigger_bitrix_alert_notification()','audit_log_trigger()',
    'tr_increment_version()','handle_optimistic_locking()',
    'update_performance_metrics()','fn_audit_trigger()',
    'update_device_last_seen()','generate_coleta_numero()','generate_entrega_numero()',
    'update_carrier_ranking()','notify_entrega_concluida()',
    'notify_ocorrencia_registrada()','notify_coleta_atrasada()',
    'update_updated_at_column()','log_biometric_anomaly()',
    'notify_frete_interno_concluido()','audit_trigger_func()',
    'notify_conquista_desbloqueada()','notify_entrega_atrasada()',
    'handle_updated_at()','validate_frete_values()','increment_version_column()',
    'increment_version()','jsonb_recursive_merge(jsonb,jsonb)',
    'cleanup_old_telemetry_logs(integer)','cleanup_old_telemetry_logs()',
    'reconcile_pending_freights()','validate_payload_schema(text,jsonb)',
    'system_health_check()','update_user_streak(uuid)'
  ];
BEGIN
  FOREACH fn IN ARRAY internal_functions LOOP
    BEGIN
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC', fn);
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM anon', fn);
      EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM authenticated', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', fn);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''))
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profile insert failed for %: %', NEW.id, SQLERRM;
  END;
  BEGIN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: role insert failed for %: %', NEW.id, SQLERRM;
  END;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_entrega_concluida()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'entregue' AND (OLD.status IS NULL OR OLD.status <> 'entregue') THEN
    INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
    SELECT DISTINCT ur.user_id, 'Entrega Concluída! 🎉',
      'A entrega ' || NEW.numero_entrega || ' foi concluída com sucesso.',
      'success','/envios',
      jsonb_build_object('entrega_id',NEW.id,'numero_entrega',NEW.numero_entrega,'event','entrega_concluida')
    FROM user_roles ur;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_coleta_atrasada()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('solicitada','em_transito')
     AND NEW.data_prevista_coleta IS NOT NULL
     AND NEW.data_prevista_coleta < NOW()
     AND NEW.data_efetiva_coleta IS NULL THEN
    INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
    SELECT DISTINCT ur.user_id,'Coleta Atrasada ⚠️',
      'A coleta ' || NEW.numero_coleta || ' está atrasada. Previsão era ' || TO_CHAR(NEW.data_prevista_coleta,'DD/MM/YYYY'),
      'warning','/coletas',
      jsonb_build_object('coleta_id',NEW.id,'numero_coleta',NEW.numero_coleta,'event','coleta_atrasada')
    FROM user_roles ur;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_ocorrencia_registrada()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ref_numero text;
BEGIN
  IF NEW.entrega_id IS NOT NULL THEN
    SELECT numero_entrega INTO v_ref_numero FROM entregas WHERE id = NEW.entrega_id;
  ELSIF NEW.coleta_id IS NOT NULL THEN
    SELECT numero_coleta INTO v_ref_numero FROM coletas WHERE id = NEW.coleta_id;
  ELSE v_ref_numero := 'N/A';
  END IF;
  INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
  SELECT DISTINCT ur.user_id,'Nova Ocorrência Registrada 🚨',
    'Uma ocorrência do tipo "' || NEW.tipo_ocorrencia || '" foi registrada para ' || v_ref_numero,
    'error','/ocorrencias',
    jsonb_build_object('ocorrencia_id',NEW.id,'tipo_ocorrencia',NEW.tipo_ocorrencia,
                       'entrega_id',NEW.entrega_id,'coleta_id',NEW.coleta_id,'event','ocorrencia_registrada')
  FROM user_roles ur;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_frete_interno_concluido()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'entregue' AND (OLD.status IS NULL OR OLD.status <> 'entregue') THEN
    INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
    SELECT DISTINCT ur.user_id,'Frete Interno Concluído! ✅',
      'Frete de ' || NEW.origem || ' para ' || NEW.destino || ' foi entregue. +' || NEW.xp_reward || ' XP!',
      'success','/fretes-internos',
      jsonb_build_object('frete_id',NEW.id,'origem',NEW.origem,'destino',NEW.destino,
                         'xp_reward',NEW.xp_reward,'event','frete_interno_concluido')
    FROM user_roles ur;
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.notify_entrega_atrasada()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('despachado','em_transito','saiu_entrega')
     AND NEW.previsao_entrega IS NOT NULL
     AND NEW.previsao_entrega < NOW()
     AND NEW.data_entrega_efetiva IS NULL
     AND NOT EXISTS (
       SELECT 1 FROM notifications
        WHERE metadata->>'entrega_id' = NEW.id::text
          AND metadata->>'event' = 'entrega_atrasada'
          AND created_at > NOW() - INTERVAL '24 hours'
     ) THEN
    INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
    SELECT DISTINCT ur.user_id,'Entrega Atrasada ⚠️',
      'A entrega ' || NEW.numero_entrega || ' está atrasada. Previsão era ' || TO_CHAR(NEW.previsao_entrega,'DD/MM/YYYY'),
      'warning','/envios',
      jsonb_build_object('entrega_id',NEW.id,'numero_entrega',NEW.numero_entrega,
                         'previsao_entrega',NEW.previsao_entrega,'event','entrega_atrasada')
    FROM user_roles ur;
  END IF;
  RETURN NEW;
END; $$;

-- Entregas
CREATE INDEX IF NOT EXISTS idx_entregas_status_created_at ON public.entregas(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entregas_cliente_status ON public.entregas(cliente_id, status);
CREATE INDEX IF NOT EXISTS idx_entregas_transp_status ON public.entregas(transportadora_id, status);
CREATE INDEX IF NOT EXISTS idx_entregas_previsao_pendente
  ON public.entregas(previsao_entrega)
  WHERE data_entrega_efetiva IS NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_entregas_active
  ON public.entregas(created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_entregas_rastreamento
  ON public.entregas(codigo_rastreamento)
  WHERE codigo_rastreamento IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_entregas_nf_remessa
  ON public.entregas(nf_remessa)
  WHERE nf_remessa IS NOT NULL AND deleted_at IS NULL;

-- Coletas
CREATE INDEX IF NOT EXISTS idx_coletas_status_created_at ON public.coletas(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coletas_transp_status ON public.coletas(transportadora_id, status);
CREATE INDEX IF NOT EXISTS idx_coletas_prevista_pendente
  ON public.coletas(data_prevista_coleta)
  WHERE data_efetiva_coleta IS NULL;

-- Notificações não lidas
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created
  ON public.notifications(user_id, created_at DESC)
  WHERE read = false;

-- Ocorrências
CREATE INDEX IF NOT EXISTS idx_ocorrencias_created_at ON public.ocorrencias(created_at DESC);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_action_created
  ON public.audit_logs(table_name, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created
  ON public.audit_logs(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Sessões (coluna correta: last_active_at)
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_last_active
  ON public.user_sessions(user_id, last_active_at DESC);

-- Fretes internos
CREATE INDEX IF NOT EXISTS idx_fretes_internos_status_created ON public.fretes_internos(status, created_at DESC);

-- Cotações multicanal
CREATE INDEX IF NOT EXISTS idx_cotacoes_multicanal_transp_valor ON public.cotacoes_multicanal(transportadora_id, valor_cotado);

-- Rastreamento histórico
CREATE INDEX IF NOT EXISTS idx_rastreamento_historico_created ON public.rastreamento_historico(created_at DESC);

-- Rate limit
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_endpoint_created
  ON public.rate_limit_logs(endpoint, created_at DESC);

-- Login attempts
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created
  ON public.login_attempts(email, created_at DESC);

-- Leaderboard
CREATE INDEX IF NOT EXISTS idx_user_levels_total_xp_desc
  ON public.user_levels(total_xp DESC)
  WHERE total_xp > 0;

-- Reward purchases
CREATE INDEX IF NOT EXISTS idx_reward_purchases_user_created
  ON public.reward_purchases(user_id, created_at DESC);
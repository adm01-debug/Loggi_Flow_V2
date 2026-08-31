
CREATE INDEX IF NOT EXISTS idx_entregas_status ON public.entregas(status);
CREATE INDEX IF NOT EXISTS idx_entregas_transportadora ON public.entregas(transportadora_id);
CREATE INDEX IF NOT EXISTS idx_entregas_cliente ON public.entregas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_entregas_previsao ON public.entregas(previsao_entrega) WHERE data_entrega_efetiva IS NULL;
CREATE INDEX IF NOT EXISTS idx_entregas_created_at ON public.entregas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entregas_codigo_rastreamento ON public.entregas(codigo_rastreamento) WHERE codigo_rastreamento IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_entregas_nf_remessa ON public.entregas(nf_remessa) WHERE nf_remessa IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_coletas_status ON public.coletas(status);
CREATE INDEX IF NOT EXISTS idx_coletas_transportadora ON public.coletas(transportadora_id);
CREATE INDEX IF NOT EXISTS idx_coletas_fornecedor ON public.coletas(fornecedor_id);
CREATE INDEX IF NOT EXISTS idx_coletas_created_at ON public.coletas(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coletas_prevista ON public.coletas(data_prevista_coleta) WHERE data_efetiva_coleta IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_ocorrencias_entrega ON public.ocorrencias(entrega_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_coleta ON public.ocorrencias(coleta_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_created_at ON public.ocorrencias(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rastreamento_coleta ON public.rastreamento_historico(coleta_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_rastreamento_order ON public.rastreamento_historico(lalamove_order_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON public.login_attempts(email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON public.login_attempts(ip_address, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_events_user_time ON public.security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events(event_type);

CREATE INDEX IF NOT EXISTS idx_cotacoes_multi_status ON public.cotacoes_multicanal(status);
CREATE INDEX IF NOT EXISTS idx_cotacoes_multi_created ON public.cotacoes_multicanal(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fretes_internos_status ON public.fretes_internos(status);
CREATE INDEX IF NOT EXISTS idx_fretes_internos_org ON public.fretes_internos(organization_id);

ANALYZE public.entregas;
ANALYZE public.coletas;
ANALYZE public.notifications;
ANALYZE public.ocorrencias;
ANALYZE public.user_roles;

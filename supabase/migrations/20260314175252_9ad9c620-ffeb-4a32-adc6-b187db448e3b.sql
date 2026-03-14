
-- Performance indices for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_entregas_status_created ON public.entregas(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coletas_status_data ON public.coletas(status, data_prevista_coleta DESC);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_entrega ON public.ocorrencias(entrega_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_created ON public.audit_logs(table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_entregas_transportadora ON public.entregas(transportadora_id) WHERE transportadora_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_coletas_transportadora ON public.coletas(transportadora_id) WHERE transportadora_id IS NOT NULL;

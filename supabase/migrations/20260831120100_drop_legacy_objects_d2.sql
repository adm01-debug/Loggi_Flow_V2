-- Etapa 38 (decisao D2): objetos criados por migrations Dez/2025-Abr/2026 que a origem Lovable nunca teve
-- e que src/, supabase/functions/ e N8N nao referenciam (grep etapa 37 = 0 ocorrencias). Todas as tabelas com 0 linhas.
DROP TRIGGER IF EXISTS coleta_xp_trigger ON public.coletas;
DROP TRIGGER IF EXISTS entrega_xp_trigger ON public.entregas;
DROP TRIGGER IF EXISTS frete_interno_xp_trigger ON public.fretes_internos;
DROP FUNCTION IF EXISTS public.trigger_coleta_xp();
DROP FUNCTION IF EXISTS public.trigger_entrega_xp();
DROP FUNCTION IF EXISTS public.trigger_frete_interno_xp();
DROP FUNCTION IF EXISTS public.notify_on_ocorrencia();
DROP FUNCTION IF EXISTS public.notify_on_sla_violation();
DROP FUNCTION IF EXISTS public.create_notification;
DROP FUNCTION IF EXISTS public.broadcast_notification;
DROP TABLE IF EXISTS public.lalamove_status_history CASCADE;
DROP TABLE IF EXISTS public.lalamove_stops CASCADE;
DROP TABLE IF EXISTS public.lalamove_orders CASCADE;
DROP TABLE IF EXISTS public.n8n_execution_logs CASCADE;
DROP TABLE IF EXISTS public.n8n_workflows CASCADE;
DROP TABLE IF EXISTS public.saved_filters CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;
DROP TABLE IF EXISTS public.entity_versions CASCADE;
DROP FUNCTION IF EXISTS public.ensure_single_default_filter();
DROP FUNCTION IF EXISTS public.update_lalamove_updated_at();
DROP FUNCTION IF EXISTS public.update_saved_filters_updated_at();

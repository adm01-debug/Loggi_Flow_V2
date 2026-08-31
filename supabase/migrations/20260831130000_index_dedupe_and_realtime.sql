-- Plano v2 etapas 13-16, 18-20 (2026-08-31). Aplicado no destino e na origem.
-- 13. audit_logs (pai -> cascata nas 13 particoes): 15 -> 10 indices
DROP INDEX IF EXISTS public.brin_audit_logs_created_at;        -- BRIN dup; fica idx_audit_logs_created_at (btree DESC, usado pela UI)
DROP INDEX IF EXISTS public.idx_audit_logs_created_at_brin;    -- BRIN dup
DROP INDEX IF EXISTS public.gin_audit_logs_new_data;           -- GIN jsonb_path_ops dup de idx_audit_logs_new_data_gin
DROP INDEX IF EXISTS public.idx_audit_logs_record_id;          -- prefixo de idx_audit_logs_record_id_created
DROP INDEX IF EXISTS public.idx_audit_logs_table_name;         -- prefixo de idx_audit_logs_table_action_created
-- 14. rastreamento_historico (pai -> 18 particoes)
DROP INDEX IF EXISTS public.idx_rastreamento_coleta;           -- dup de idx_rastreamento_historico_coleta_id
DROP INDEX IF EXISTS public.idx_rastreamento_order;            -- dup de idx_rastreamento_lalamove_order
-- 15. pares identicos (mesma coluna/opclass/predicado): fica o canonico ou o de constraint
DROP INDEX IF EXISTS public.idx_alertas_custo_transportadora;
DROP INDEX IF EXISTS public.idx_allowed_ips_user;
DROP INDEX IF EXISTS public.idx_coletas_fornecedor;
DROP INDEX IF EXISTS public.idx_coletas_prevista;
DROP INDEX IF EXISTS public.idx_coletas_status;
DROP INDEX IF EXISTS public.idx_comments_user;
DROP INDEX IF EXISTS public.idx_conciliacao_itens_conciliacao_id;
DROP INDEX IF EXISTS public.idx_conciliacao_itens_conciliado_por;
DROP INDEX IF EXISTS public.db_slo_daily_day_idx;
DROP INDEX IF EXISTS public.idx_email_verification_token;
DROP INDEX IF EXISTS public.idx_entregas_cliente;
DROP INDEX IF EXISTS public.idx_entregas_status_created;
DROP INDEX IF EXISTS public.idx_fretes_internos_org;
DROP INDEX IF EXISTS public.idx_geo_blocking_country_code;
DROP INDEX IF EXISTS public.idx_login_attempts_email_time;
DROP INDEX IF EXISTS public.idx_ocorrencias_coleta;
DROP INDEX IF EXISTS public.idx_ocorrencias_entrega;
DROP INDEX IF EXISTS public.idx_push_subscriptions_user;
DROP INDEX IF EXISTS public.idx_rastreamento_alertas_coleta;
DROP INDEX IF EXISTS public.idx_rte_gateway_health_gateway_checked;
DROP INDEX IF EXISTS public.idx_security_events_user;
DROP INDEX IF EXISTS public.idx_tabelas_frete_transportadora;
DROP INDEX IF EXISTS public.idx_rotas_transportadora;
DROP INDEX IF EXISTS public.idx_transportadoras_cnpj;
DROP INDEX IF EXISTS public.idx_user_levels_user_id;
DROP INDEX IF EXISTS public.idx_user_roles_user;
DROP INDEX IF EXISTS public.idx_webhook_event_lookup;
-- 16. created_at: um indice por tabela (tabelas < 5k linhas: btree; BRIN sai)
DROP INDEX IF EXISTS public.brin_geo_blocked_attempts_created_at;
DROP INDEX IF EXISTS public.brin_login_attempts_created_at;
DROP INDEX IF EXISTS public.brin_notifications_created_at;
DROP INDEX IF EXISTS public.brin_query_telemetry_created_at;
DROP INDEX IF EXISTS public.brin_rate_limit_logs_created_at;
DROP INDEX IF EXISTS public.brin_security_events_created_at;
DROP INDEX IF EXISTS public.brin_telemetry_logs_created_at;
-- 20. realtime: o frontend assina postgres_changes nestas tabelas e a publication estava vazia
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications, public.entregas, public.nexus_tactical_logs, public.cotacoes_multicanal, public.risk_zones;

-- Etapas 36 (blocos 1-2 do cleanup_triggers_source.sql + extra), 50, 22 e 34 aplicadas na ORIGEM em 2026-08-31
-- HISTÓRICO — NÃO REEXECUTAR: registro do que já foi aplicado. Desde o cutover a origem
-- (hgicfqjayrjurivtygqf) é somente leitura (AGENTS.md › Banco).
-- Revisão 2026-11-09, só para que uma reexecução acidental seja inofensiva: BEGIN/COMMIT (antes, um
-- erro no meio deixava a remediação aplicada pela metade) e CREATE OR REPLACE TRIGGER (antes, a 2ª
-- execução falhava com "trigger already exists"). Os demais comandos são os aplicados em 2026-08-31.
BEGIN;
-- entregas
DROP TRIGGER IF EXISTS tr_entregas_version ON public.entregas;
DROP TRIGGER IF EXISTS tr_increment_entrega_version ON public.entregas;
DROP TRIGGER IF EXISTS tr_version_entregas ON public.entregas;
DROP TRIGGER IF EXISTS tr_increment_version_entregas ON public.entregas;
DROP TRIGGER IF EXISTS trigger_increment_version_entregas ON public.entregas;
-- transportadoras
DROP TRIGGER IF EXISTS tr_transportadoras_version ON public.transportadoras;
DROP TRIGGER IF EXISTS tr_version_transportadoras ON public.transportadoras;
DROP TRIGGER IF EXISTS trigger_increment_version_transportadoras ON public.transportadoras;
-- cotacoes_frete
DROP TRIGGER IF EXISTS tr_cotacoes_frete_version ON public.cotacoes_frete;
DROP TRIGGER IF EXISTS tr_version_cotacoes ON public.cotacoes_frete;
DROP TRIGGER IF EXISTS tr_increment_version_cotacoes_frete ON public.cotacoes_frete;
DROP TRIGGER IF EXISTS tr_cotacoes_version ON public.cotacoes_frete;
CREATE OR REPLACE TRIGGER update_cotacoes_frete_updated_at BEFORE UPDATE ON public.cotacoes_frete FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE OR REPLACE TRIGGER tr_increment_cotacoes_frete_version BEFORE UPDATE ON public.cotacoes_frete FOR EACH ROW EXECUTE FUNCTION public.increment_version_column();
-- coletas
DROP TRIGGER IF EXISTS tr_version_coletas ON public.coletas;
-- BLOCO 2: audit redundantes
DROP TRIGGER IF EXISTS audit_clientes ON public.clientes;
DROP TRIGGER IF EXISTS audit_coletas ON public.coletas;
DROP TRIGGER IF EXISTS audit_cotacoes_frete ON public.cotacoes_frete;
DROP TRIGGER IF EXISTS audit_cotacoes_frete_trigger ON public.cotacoes_frete; -- extra: 3o audit (audit_trigger_func) nao coberto pelo script
DROP TRIGGER IF EXISTS audit_entregas ON public.entregas;
DROP TRIGGER IF EXISTS audit_fornecedores ON public.fornecedores;
DROP TRIGGER IF EXISTS audit_fretes_internos ON public.fretes_internos;
DROP TRIGGER IF EXISTS audit_transportadoras ON public.transportadoras;
DROP TRIGGER IF EXISTS trg_audit_alertas_custo ON public.alertas_custo;
DROP TRIGGER IF EXISTS trg_audit_business_rules ON public.business_rules;
DROP TRIGGER IF EXISTS trg_audit_cotacoes_frete ON public.cotacoes_frete;
DROP TRIGGER IF EXISTS trg_audit_tabelas_frete ON public.tabelas_frete;
DROP TRIGGER IF EXISTS trg_audit_transportadoras ON public.transportadoras;
DROP TRIGGER IF EXISTS audit_ocorrencias ON public.ocorrencias;
DROP TRIGGER IF EXISTS update_business_rules_updated_at ON public.business_rules_config;
-- Etapa 50: crons nexus duplicados (unschedule, como no destino)
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname IN ('nexus_heartbeat','nexus_notifications_ttl','nexus_telemetry_cleanup');
-- Etapa 22: revogar EXECUTE de anon/authenticated nas 5 funcoes sensiveis
REVOKE EXECUTE ON FUNCTION public.purge_rte_gateway_health(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rte_rollup_slo_daily(date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rte_gateway_sustained_downtime(integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_delay_predictions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_predictions_accurate() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_rte_gateway_health(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.rte_rollup_slo_daily(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.rte_gateway_sustained_downtime(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_delay_predictions() TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_predictions_accurate() TO service_role;
-- Etapa 34: achievements.Anyone can view -> TO authenticated (como no destino)
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT TO authenticated USING (true);

-- 2026-08-31 (auditoria): duplicata de version em cotacoes_multicanal nao coberta pelo cleanup (fica trigger_increment_version_cotacoes)
DROP TRIGGER IF EXISTS tr_cotacoes_multicanal_version ON public.cotacoes_multicanal;

-- 2026-08-31: auditar rate_limit_logs gerava 1 audit_log por evento de rate limit (96,7% do audit_logs era esse ruido). Removido nos 2 bancos.
DROP TRIGGER IF EXISTS audit_log_trigger ON public.rate_limit_logs;
COMMIT;

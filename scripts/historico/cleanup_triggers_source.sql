-- ==========================================================
-- CLEANUP DE TRIGGERS DUPLICADOS — SOURCE hgicfqjayrjurivtygqf
-- Gerado em 2026-08-28
-- Espelha o cleanup já aplicado no destino (jvfhclubfpxrtrrazrgr)
-- APLICAR VIA: Lovable Studio → SQL Editor, ou psql direto
--
-- HISTÓRICO — NÃO REEXECUTAR. Blocos 1-2 foram aplicados na origem em 2026-08-31 (registro em
-- scripts/origem_remediacao_2026-08-31.sql); o bloco 3 foi substituído lá por cron.unschedule.
-- Desde o cutover a origem é somente leitura (AGENTS.md › Banco). Fica no repo como registro.
-- Revisão 2026-11-09, só para que uma reexecução acidental seja inofensiva: BEGIN/COMMIT (antes,
-- um erro no meio deixava cotacoes_frete sem trigger de updated_at) e CREATE OR REPLACE TRIGGER
-- (antes, a 2ª execução falhava com "trigger already exists").
-- ==========================================================

BEGIN;

-- ==========================================
-- BLOCO 1: Version-increment duplicados
-- ==========================================
-- MANTIDOS: tr_increment_entregas_version (→ increment_version_column)
--           tr_increment_version_transportadoras (→ increment_version_column)
--           tr_increment_cotacoes_frete_version (→ increment_version_column) [NOVO]
--           tr_increment_coletas_version (→ increment_version_column)
-- 
-- NOTA cotacoes_frete: no source ainda existe tr_cotacoes_version (→ tr_increment_version)
-- que mistura version e updated_at. Dropar + criar 2 triggers separados.

-- entregas: 3x increment_version + 2x increment_version_column extras
DROP TRIGGER IF EXISTS tr_entregas_version             ON public.entregas;
DROP TRIGGER IF EXISTS tr_increment_entrega_version    ON public.entregas;
DROP TRIGGER IF EXISTS tr_version_entregas             ON public.entregas;
DROP TRIGGER IF EXISTS tr_increment_version_entregas   ON public.entregas;
DROP TRIGGER IF EXISTS trigger_increment_version_entregas ON public.entregas;

-- transportadoras: 2x increment_version + 1x increment_version_column extras
DROP TRIGGER IF EXISTS tr_transportadoras_version           ON public.transportadoras;
DROP TRIGGER IF EXISTS tr_version_transportadoras           ON public.transportadoras;
DROP TRIGGER IF EXISTS trigger_increment_version_transportadoras ON public.transportadoras;

-- cotacoes_frete: 2x increment_version + trigger misto tr_cotacoes_version
DROP TRIGGER IF EXISTS tr_cotacoes_frete_version          ON public.cotacoes_frete;
DROP TRIGGER IF EXISTS tr_version_cotacoes                ON public.cotacoes_frete;
DROP TRIGGER IF EXISTS tr_increment_version_cotacoes_frete ON public.cotacoes_frete;
DROP TRIGGER IF EXISTS tr_cotacoes_version                ON public.cotacoes_frete;  -- trigger misto

-- cotacoes_frete: criar triggers separados (já aplicado no destino)
CREATE OR REPLACE TRIGGER update_cotacoes_frete_updated_at
  BEFORE UPDATE ON public.cotacoes_frete
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER tr_increment_cotacoes_frete_version
  BEFORE UPDATE ON public.cotacoes_frete
  FOR EACH ROW EXECUTE FUNCTION public.increment_version_column();

-- coletas: 1x increment_version extra
DROP TRIGGER IF EXISTS tr_version_coletas ON public.coletas;

-- ==========================================
-- BLOCO 2: Audit triggers redundantes
-- ==========================================
-- 7 tabelas com audit_log_trigger duplicado
DROP TRIGGER IF EXISTS audit_clientes       ON public.clientes;
DROP TRIGGER IF EXISTS audit_coletas        ON public.coletas;
DROP TRIGGER IF EXISTS audit_cotacoes_frete ON public.cotacoes_frete;
DROP TRIGGER IF EXISTS audit_entregas       ON public.entregas;
DROP TRIGGER IF EXISTS audit_fornecedores   ON public.fornecedores;
DROP TRIGGER IF EXISTS audit_fretes_internos ON public.fretes_internos;
DROP TRIGGER IF EXISTS audit_transportadoras ON public.transportadoras;

-- fn_audit_trigger em 5 tabelas (usa information_schema.columns em loop — muito lento)
DROP TRIGGER IF EXISTS trg_audit_alertas_custo   ON public.alertas_custo;
DROP TRIGGER IF EXISTS trg_audit_business_rules  ON public.business_rules;
DROP TRIGGER IF EXISTS trg_audit_cotacoes_frete  ON public.cotacoes_frete;
DROP TRIGGER IF EXISTS trg_audit_tabelas_frete   ON public.tabelas_frete;
DROP TRIGGER IF EXISTS trg_audit_transportadoras ON public.transportadoras;

-- audit_trigger_func em ocorrencias
DROP TRIGGER IF EXISTS audit_ocorrencias ON public.ocorrencias;

-- business_rules_config: trigger de updated_at mal-nomeado
DROP TRIGGER IF EXISTS update_business_rules_updated_at ON public.business_rules_config;

-- ==========================================
-- BLOCO 3: Cron jobs legados
-- ==========================================
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'nexus_telemetry_cleanup')::bigint,
  active := false
) WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nexus_telemetry_cleanup' AND active = true);

SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'nexus_notifications_ttl')::bigint,
  active := false
) WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nexus_notifications_ttl' AND active = true);

SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'nexus_heartbeat')::bigint,
  active := false
) WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nexus_heartbeat' AND active = true);

COMMIT;

-- ==========================================
-- VERIFICAÇÃO FINAL
-- ==========================================
SELECT 
  event_object_table AS tabela,
  trigger_name,
  action_statement AS fn
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('entregas','transportadoras','cotacoes_frete','coletas')
  AND action_statement ILIKE ANY(ARRAY['%increment_version%','%tr_increment_version%'])
  AND event_manipulation = 'UPDATE'
ORDER BY tabela, trigger_name;

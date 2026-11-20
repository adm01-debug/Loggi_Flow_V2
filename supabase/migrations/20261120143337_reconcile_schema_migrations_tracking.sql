-- Reconcilia o tracking de migrations do Supabase com os arquivos do repo.
-- Causa: 13 linhas registraram apenas o timestamp (aplicacao fora do CLI, sem sufixo)
-- e 4 migrations reais estao aplicadas no schema mas ausentes do schema_migrations.
-- Esta migration NAO altera schema; apenas corrige metadados para o app 'Supabase Preview'
-- parar de acusar "Remote migration versions not found in local migrations directory".
-- Rollback: nada a reverter (colunas/linhas de controle).

-- 1/3 — Corrige o version das 13 linhas ts-only para o formato <ts>_<nome>
-- (o CLI e o app 'Supabase Preview' comparam version com o arquivo <ts>_<nome>.sql).
UPDATE supabase_migrations.schema_migrations
SET version = version || '_add_nexus_score_to_user_levels'
WHERE version = '20260813120000';

UPDATE supabase_migrations.schema_migrations
SET version = version || '_fix_audit_log_trigger_no_id_column'
WHERE version = '20260813130000';

UPDATE supabase_migrations.schema_migrations
SET version = version || '_fix_record_heartbeat_columns'
WHERE version = '20260822190000';

UPDATE supabase_migrations.schema_migrations
SET version = version || '_fix_alert_slow_queries_columns'
WHERE version = '20260831120000';

UPDATE supabase_migrations.schema_migrations
SET version = version || '_drop_legacy_objects_d2'
WHERE version = '20260831120100';

UPDATE supabase_migrations.schema_migrations
SET version = version || '_policy_parity_with_origin'
WHERE version = '20260831120200';

UPDATE supabase_migrations.schema_migrations
SET version = version || '_ensure_monthly_partition_reloptions'
WHERE version = '20260831120300';

UPDATE supabase_migrations.schema_migrations
SET version = version || '_index_dedupe_and_realtime'
WHERE version = '20260831130000';

UPDATE supabase_migrations.schema_migrations
SET version = version || '_drop_legacy_columns'
WHERE version = '20260831130100';

UPDATE supabase_migrations.schema_migrations
SET version = version || '_no_audit_on_rate_limit_logs'
WHERE version = '20260831130200';

UPDATE supabase_migrations.schema_migrations
SET version = version || '_cron_jobs_canonical'
WHERE version = '20260901000000';

UPDATE supabase_migrations.schema_migrations
SET version = version || '_remediacao_destino'
WHERE version = '20260901000001';

UPDATE supabase_migrations.schema_migrations
SET version = version || '_hardening_pos_auditoria'
WHERE version = '20260902120000';

-- 2/3 — Registra migrations ja aplicadas (efeito comprovado no schema) ausentes do tracking.
-- Usado o formato do CLI (version coincidindo com o arquivo no repo).
INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
SELECT '20261117120000_fix_rpcs_observabilidade', '{}'
  WHERE NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations
                    WHERE version = '20261117120000_fix_rpcs_observabilidade');

INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
SELECT '20261117150000_add_peso_efetivo_coletas', '{}'
  WHERE NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations
                    WHERE version = '20261117150000_add_peso_efetivo_coletas');

INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
SELECT '20261118220000_fix_notif_type_enum_cast', '{}'
  WHERE NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations
                    WHERE version = '20261118220000_fix_notif_type_enum_cast');

INSERT INTO supabase_migrations.schema_migrations (version, statements, name)
SELECT '20261120120000_restore_grant_execute_add_user_xp', '{}'
  WHERE NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations
                    WHERE version = '20261120120000_restore_grant_execute_add_user_xp');

-- 3/3 — Guarda: nao pode sobrar linhas ts-only.
DO $$
DECLARE sobraram int;
BEGIN
  SELECT count(*) INTO sobraram FROM supabase_migrations.schema_migrations
   WHERE position('_' in version) = 0;
  IF sobraram > 0 THEN
    RAISE EXCEPTION 'Reconciliacao incompleta: % linhas sem sufixo no schema_migrations', sobraram;
  END IF;
END $$;

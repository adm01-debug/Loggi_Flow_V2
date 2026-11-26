-- Remove 7 tabelas sem nenhum consumidor, comprovadas mortas em 26/11 pelo censo de cobertura UI
-- (docs/qa/08-AUDITORIA-COBERTURA-UI.md, secao "DECIDIR") e reverificadas no catalogo de producao:
--   0 linhas (exceto system_contract_schemas, 3 linhas de fixture), 0 FK entrante, 0 view,
--   0 funcao citando o nome no corpo, 0 politica de OUTRA tabela citando o nome e 0 mencao em
--   src/, supabase/functions/ ou scripts/ fora das migrations e dos artefatos gerados.
--
-- Por que cada uma sai:
--   account_lockouts          nao existe logica de lockout no app; bloqueio de login e do Supabase Auth.
--   allowed_ips               duplicata morta: a tela usa ip_access_rules + geo_blocking_rules
--                             (src/components/security/IPAccessControl.tsx).
--   email_verification_tokens verificacao de email e feita pelo Supabase Auth.
--   driver_badges             duplicata morta: gamificacao usa achievements/user_achievements
--                             (src/pages/Conquistas.tsx).
--   notification_templates    duplicata morta: notificacoes usam a tabela notifications
--                             (src/pages/Notificacoes.tsx).
--   system_adr                duplicata morta: ADR usa architecture_decisions (src/pages/AdminADR.tsx).
--   system_contract_schemas   o unico leitor era validate_payload_schema(), removida em
--                             20261126130000; _shared/contract-validator.ts grava em contract_test_logs.
--
-- Fica de fora, por decisao do dono registrada no doc 08: organizations +
-- get_current_organization_id() + has_permission(), que tem FK entrante (profiles,
-- fretes_internos) e 3 politicas de RLS ativas.
--
-- Sem CASCADE de proposito: se qualquer dependencia nova aparecer, a migration falha em vez de
-- levar objetos junto. As 3 linhas de system_contract_schemas estao preservadas no rollback.
-- Rollback: supabase/rollbacks/20261126170000_rollback_remove_tabelas_mortas.sql

begin;

drop table if exists public.account_lockouts;
drop table if exists public.allowed_ips;
drop table if exists public.driver_badges;
drop table if exists public.email_verification_tokens;
drop table if exists public.notification_templates;
drop table if exists public.system_adr;
drop table if exists public.system_contract_schemas;

commit;
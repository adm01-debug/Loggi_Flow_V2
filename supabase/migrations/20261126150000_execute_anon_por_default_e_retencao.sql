-- Causa raiz do achado da 20261126140000: os default privileges do role postgres no schema
-- public concedem EXECUTE em funcoes para anon e authenticated
-- (pg_default_acl: tipo=f acl={postgres=X,anon=X,authenticated=X,service_role=X}).
-- Por isso o "REVOKE ALL ... FROM PUBLIC" da 20261126120000 nao bastou em
-- cleanup_old_contract_test_logs(integer): o grant de anon era explicito, vindo do default.
--
-- 1) tira anon (e authenticated, que nao usa) da funcao de retencao, que apaga log de contrato;
-- 2) remove anon dos default privileges de funcoes: as proximas funcoes nao nascem alcancaveis
--    sem login. authenticated continua com o default, porque as RPCs do app rodam logado, e
--    o que precisa ser publico (get_public_tracking) tem grant explicito.

REVOKE EXECUTE ON FUNCTION public.cleanup_old_contract_test_logs(integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_contract_test_logs(integer) TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;
-- O mesmo default existe para o role supabase_admin, mas o usuario da migration nao e membro
-- dele (permission denied no ensaio); objetos criados pelo dashboard seguem rodando esse caminho.

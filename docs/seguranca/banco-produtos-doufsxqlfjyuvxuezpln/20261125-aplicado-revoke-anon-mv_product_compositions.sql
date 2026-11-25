-- Banco: doufsxqlfjyuvxuezpln (gestao de produtos) - NAO e o banco deste repositorio.
-- Nao colocar em supabase/migrations/: o workflow aplicar-migration.yml roda contra o
-- banco oficial do Loggi Flow. Este arquivo e registro do que foi executado no outro projeto.
--
-- Achado: public.mv_product_compositions e um wrapper (security_invoker = false) sobre
-- analytics.mv_product_compositions, que nao tem grant para anon nem para authenticated.
-- O wrapper concedia SELECT a anon, entao a chave publica (a que vai no navegador) lia a
-- materialized view com organization_id e product_name. Executado em 2026-11-25 em transacao.

begin;

revoke select on public.mv_product_compositions from anon;

commit;

-- Verificacao (esperado: so postgres, service_role e authenticated na coluna grantee):
--   select grantee, privilege_type from information_schema.role_table_grants
--   where table_schema = 'public' and table_name = 'mv_product_compositions'
--   order by grantee, privilege_type;

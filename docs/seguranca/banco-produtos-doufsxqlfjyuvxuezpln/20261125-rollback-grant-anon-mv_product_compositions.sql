-- Desfaz o REVOKE acima (volta a expor a view a chave publica). Use somente se algo depender dela.
begin;
grant select on public.mv_product_compositions to anon;
commit;

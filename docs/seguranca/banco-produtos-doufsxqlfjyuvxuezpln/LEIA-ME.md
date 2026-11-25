# Banco de produtos `doufsxqlfjyuvxuezpln` - endurecimento de 2026-11-25

O Loggi Flow **replica** dados deste banco; ele nao e o banco oficial do sistema
(`jvfhclubfpxrtrrazrgr`). Por isso nada aqui vive em `supabase/migrations/`.

## O que foi auditado

Pedido do dono: "16 tabelas deixam qualquer um que tenha a chave publica ler direto, incluindo
a tabela de preco oficial". A auditoria foi feita no banco ao vivo antes de revogar qualquer
coisa, e a conclusao mudou o plano:

| Suspeita | Resultado da medicao |
| --- | --- |
| Tabelas expostas a `anon` | 25 tabelas tem grant a `anon` **e** a `authenticated`, todas com RLS ligado |
| Politicas "abertas" | sao de catalogo: `*_public_read`, `*_anon_read`, `collections_anon_shared_view` (por `share_token`), `favorite_*`, `content_articles_anon_select` (so `published`) |
| Views `*_public` | `v_products_public`, `v_suppliers_public`, `v_tabela_preco_gravacao_oficial_public`, `v_variant_sale_prices_public` - leitura publica **intencional** |
| `v_compras_*` (`security_invoker=false`) | trazem `WHERE ... AND (auth.uid() IS NULL OR can_view_all_sales())` e so tem grant a `authenticated` - nao sao furo |
| Funcoes `SECURITY DEFINER` executaveis por `anon` | 9, todas de catalogo/portal/rate-limit e todas com `search_path` fixo |
| `public.mv_product_compositions` | **vazamento real** - ver abaixo |

Revogar `anon` em bloco teria quebrado o catalogo publico e os links compartilhados. Por isso
**uma unica correcao** foi aplicada.

## O vazamento corrigido

`public.mv_product_compositions` e `security_invoker = false` sobre
`analytics.mv_product_compositions`, que **nao** tem grant para `anon` nem para `authenticated`.
O wrapper concedia `SELECT` a `anon`, entao a chave publica conseguia ler a materialized view
(com `organization_id` e `product_name`).

Aplicado: `REVOKE SELECT ON public.mv_product_compositions FROM anon` em transacao.
Script: `20261125-aplicado-revoke-anon-mv_product_compositions.sql`.
Rollback: `20261125-rollback-grant-anon-mv_product_compositions.sql`.

### Prova antes/depois (REST, mesma chave publica)

| Recurso | Antes | Depois |
| --- | --- | --- |
| `mv_product_compositions?select=organization_id,product_name` | `200` com linhas | `401` |
| `categories` | `200` | `200` |
| `v_products_public` | `200` | `200` |
| `v_tabela_preco_gravacao_oficial_public` | `200` | `200` |

`authenticated` e `service_role` nao foram tocados.

## Pendencias conhecidas nesta base (nao corrigidas)

- `crm_seller_identity_links`: RLS ligado e **zero policies**. Ninguem le pela API; parece bug de
  feature, nao de seguranca. Decisao de negocio.
- `service_role` continua com `SELECT` na view (correto, e o papel de servidor).

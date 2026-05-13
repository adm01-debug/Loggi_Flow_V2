# ADR 0002: Estratégia de Segurança de Dados (RLS)

## Status
Aceito

## Contexto
O sistema armazena dados sensíveis de clientes, entregas e chaves de API.

## Decisão
- **RLS Ativado:** 100% das tabelas no schema 'public' devem ter RLS habilitado.
- **RBAC:** Utilizar a função `has_role()` com SECURITY DEFINER para checar permissões sem recursão infinita.
- **Audit Logs:** Auditoria automática via triggers em todas as operações de escrita.
- **Políticas Restritivas:** Proibir `USING (true)` em tabelas críticas, exigindo verificação de `auth.uid()` ou roles administrativas.

## Consequências
- Proteção robusta contra vazamento de dados.
- Overhead mínimo de performance.

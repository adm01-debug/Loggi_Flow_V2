# ADR 0002: Estratégia de Autorização (RLS & RBAC)

## Data
2026-05-13

## Status
Aceito

## Contexto
O sistema armazena dados sensíveis de múltiplas empresas (multi-tenant) e requer controle de acesso granular.

## Decisão
- **RLS (Row Level Security):** 100% das tabelas devem ter políticas RLS habilitadas. Nenhuma tabela pode ser exposta publicamente sem controle.
- **RBAC (Role-Based Access Control):** Papéis definidos via tabela `user_roles` (`admin`, `coordenador`, `operacional`, `cliente`, `entregador`).
- **Função `has_role`:** Uso de funções customizadas com `SECURITY DEFINER` para verificar papéis sem causar recursão infinita nas políticas RLS.
- **Auditoria:** Triggers de banco de dados capturam todas as alterações para a tabela `audit_logs`.

## Consequências
- **Prós:** Segurança robusta garantida na camada de dados, impossibilidade de vazamento de dados via API REST.
- **Contras:** Aumento da complexidade nas migrações de banco de dados e necessidade de testes extensivos de políticas.

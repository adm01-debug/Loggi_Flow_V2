# ADR 0002: Estratégia de Segurança via RLS (Row Level Security)

## Status
Aceito

## Contexto
Necessidade de garantir isolamento de dados entre empresas, transportadoras e usuários administrativos no LogiFlow.

## Decisões
- **RLS Ativado por Padrão:** Todas as tabelas no schema `public` devem ter RLS habilitado.
- **Funções Security Definer:** Uso de funções auxiliares (`has_role`, `is_admin`) com `SECURITY DEFINER` para evitar recursão infinita e garantir performance nas políticas.
- **RBAC:** Controle de acesso baseado em roles (Admin, Transportadora, Cliente, Financeiro).

## Consequências
- Camada de segurança resiliente mesmo em caso de falha no frontend.
- Auditoria simplificada.

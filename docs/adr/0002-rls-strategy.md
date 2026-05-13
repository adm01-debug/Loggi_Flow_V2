# ADR 0002: Estratégia de Segurança RLS (Row Level Security)

## Status
Aceito (Meta 10/10)

## Contexto
Segurança de dados multitenant é crítica.

## Decisão
- RLS habilitado em 100% das tabelas.
- Uso de funções `SECURITY DEFINER` para checagem de roles (evitando recursão).
- Auditoria via triggers automáticos em todas as mutações.

## Consequências
- Garantia de que usuários só acessam seus próprios registros ou registros permitidos por sua role.

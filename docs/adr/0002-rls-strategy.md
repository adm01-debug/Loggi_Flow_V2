# ADR 0002: Estratégia de Segurança RLS (Row Level Security)

## Data: 2026-05-13
## Status: Aceito

## Contexto
O sistema armazena dados sensíveis de logística, clientes e faturamento de múltiplos usuários e transportadoras.

## Decisão
- Implementar RLS em **todas** as tabelas do schema public.
- Utilizar funções `SECURITY DEFINER` (ex: `has_role`) para evitar recursão infinita e centralizar lógica de permissão.
- Bloquear acesso por padrão (Restrictive policies) e liberar granularmente por role.

## Consequências
- Garantia de isolamento de dados no nível do banco de dados, protegendo contra falhas no frontend.

# ADR 0003: Integração Multi-Transportadoras

## Status
Aceito (Meta 10/10)

## Contexto
Necessidade de integrar Lalamove, Rodonaves e Melhor Envio simultaneamente.

## Decisão
- Abstração via Hooks Customizados (`useLalamove`, `useRodonaves`).
- Webhooks centralizados com persistência de eventos para garantir idempotência.
- Central de rastreio unificada.

## Consequências
- Flexibilidade para adicionar novas transportadoras sem quebrar o core do sistema.

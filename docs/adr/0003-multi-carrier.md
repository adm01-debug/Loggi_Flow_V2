# ADR 0003: Estratégia de Múltiplas Transportadoras e Gateways

## Status
Aceito

## Contexto
O LogiFlow deve orquestrar entregas usando Lalamove, Rodonaves e Melhor Envio simultaneamente.

## Decisões
- **Abstração via Hooks:** Cada transportadora possui um hook e service dedicado (`useLalamove`, `useRodonaves`, etc.).
- **Diferenciação de Fluxos:** Lalamove para entregas locais rápidas; Rodonaves para carga fracionada pesada; Melhor Envio para encomendas padrão.
- **Idempotência:** Webhooks de status devem ser idempotentes para evitar duplicação de eventos.

## Consequências
- Flexibilidade para adicionar novas transportadoras sem quebrar o sistema central.
- Robustez no rastreamento.

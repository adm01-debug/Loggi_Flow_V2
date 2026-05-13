# ADR 0003: Integração Multi-Carrier (Multi-Transportadora)

## Data: 2026-05-13
## Status: Aceito

## Contexto
Necessidade de orquestrar múltiplos provedores de frete (Lalamove, Rodonaves, Melhor Envio) com regras de negócio distintas.

## Decisão
- Criar uma camada de serviços (`src/integrations/`) que padroniza o input/output de cada transportadora.
- Utilizar Edge Functions para processamento de webhooks e chamadas pesadas de API, garantindo segurança das chaves API.
- Persistir eventos de rastreio em esquema unificado para visualização centralizada.

## Consequências
- Facilidade em adicionar novos provedores sem alterar o core da interface de rastreamento.

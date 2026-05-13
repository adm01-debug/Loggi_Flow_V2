# ADR 0003: Integração com Múltiplas Transportadoras

## Data
2026-05-13

## Status
Aceito

## Contexto
O LogiFlow precisa unificar cotações e rastreamento de diversas transportadoras (Lalamove, Rodonaves, Melhor Envio, etc.).

## Decisão
- **Gateway via Edge Functions:** Cada transportadora possui sua própria Edge Function para isolar tokens de API e lógica de mapeamento.
- **Normalização de Dados:** Respostas heterogêneas das APIs externas são normalizadas para um formato padrão LogiFlow antes de retornar ao frontend.
- **Circuit Breaker:** Implementação de padrão de disjuntor para evitar que falhas em uma transportadora afetem a performance global do sistema.
- **Cashing:** Uso de Redis para cachear cotações de frete por 10 minutos para reduzir custos e latência.

## Consequências
- **Prós:** Escalabilidade para adicionar novas transportadoras sem alterar o core do sistema.
- **Contras:** Necessidade de manter múltiplos adaptadores atualizados conforme as APIs externas mudam.

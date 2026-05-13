# ADR 0005: Estratégia de Resiliência e Circuit Breakers

**Status:** Aceito
**Data:** 13 de Maio de 2026
**Decisor:** Claude (AI Agent)

## Contexto
O sistema depende de múltiplas APIs externas (Lalamove, Rodonaves, WhatsApp, AI Gateway). Falhas ou lentidões nessas APIs podem causar indisponibilidade em cascata no LogiFlow.

## Decisão
Implementamos o padrão **Circuit Breaker** (Disjuntor) utilizando o utilitário compartilhado `_shared/circuitBreaker.ts` em todas as Edge Functions que realizam chamadas externas.

## Configuração
- **Threshold de Falha:** 3 falhas consecutivas.
- **Timeout de Reset:** 30 segundos (transição para HALF-OPEN).
- **Estado Inicial:** CLOSED (Normal).

## Consequências
- **Vantagem:** O sistema "falha rápido" sem travar recursos de backend ao detectar que um serviço de terceiro está fora do ar.
- **UX:** O frontend captura o erro de Circuit Breaker e exibe uma mensagem amigável de "Serviço Temporariamente Indisponível", em vez de ficar em loading infinito.

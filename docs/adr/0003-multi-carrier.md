# ADR 0003: Multi-Carrier Integration Pattern

## Status
Accepted

## Context
LogiFlow integrates with multiple carriers (Lalamove, Rodonaves, Melhor Envio) with disparate APIs.

## Decision
- Use a **Unified Interface** pattern via Edge Functions to normalize responses.
- Implement specialized webhooks for each carrier that update a central `entregas` table.
- Maintain carrier-specific configurations in a secure `transportadoras` table with RLS protection.

## Consequences
- Simplified frontend consumption of tracking and quote data.
- Isolated failure points for each integration.

# ADR 003: Multi-Carrier Integration Strategy

## Status
Accepted

## Context
The system needs to support multiple carriers (Lalamove, Rodonaves, Melhor Envio) with different APIs.

## Decision
- **Service Layer**: Implement carrier-specific logic in isolated services.
- **Edge Functions**: Use Supabase Edge Functions for sensitive API calls and webhooks.
- **Unified Interface**: Create a unified tracking and dispatch interface in the frontend that abstracts carrier differences.

## Consequences
- Easier to add new carriers.
- Centralized tracking monitoring.

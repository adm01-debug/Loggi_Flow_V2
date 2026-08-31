# ADR 0001: Stack Choice

## Status
Accepted

## Context
The LogiFlow project requires a scalable, modern, and highly performant architecture to handle complex logistics operations, multiple carrier integrations (Lalamove, Rodonaves, etc.), and real-time tracking.

## Decision
We chose the following core stack:
- **Frontend**: React 18 with Vite 5 and TypeScript 5.
- **Styling**: TailwindCSS 3 with shadcn/ui for consistent design.
- **State Management**: React Query 5 (TanStack Query) for server-state caching.
- **Backend**: Lovable Cloud (Supabase) for Database (PostgreSQL), Auth, and Edge Functions (Deno).
- **Communication**: Resend for emails and Evolution/A-Ticket for WhatsApp.

## Consequences
- Single source of truth for server state.
- Type safety across the full stack.
- Rapid deployment and integrated security via Lovable Cloud.

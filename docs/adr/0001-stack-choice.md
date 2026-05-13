# ADR 001: Stack Choice

## Status
Accepted

## Context
LogiFlow is a logistics and transport management system that requires real-time updates, offline capabilities, and high reliability.

## Decision
We chose the following stack:
- **Frontend**: React 18 + Vite + TypeScript (for type safety and performance).
- **Styling**: TailwindCSS + shadcn/ui (for consistent, accessible, and fast UI development).
- **Backend/DB**: Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- **State Management**: React Query (for server state) + React Context/Zustand (for client state).

## Consequences
- High developer productivity.
- Built-in scalability and security via RLS.
- Strong type safety across the stack.

# ADR 002: RLS (Row Level Security) Strategy

## Status
Accepted

## Context
Security and data isolation are critical for multi-tenant or multi-user logistics operations.

## Decision
- **Mandatory RLS**: All tables in the `public` schema must have RLS enabled.
- **RBAC**: Use `auth.uid()` coupled with a `user_roles` table.
- **Security Definer**: Use `SECURITY DEFINER` functions for role checking to avoid recursive policy loops.

## Consequences
- Data is secured at the database level.
- Reduced risk of accidental data leakage in the frontend.

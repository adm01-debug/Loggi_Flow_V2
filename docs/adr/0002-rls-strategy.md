# ADR 0002: Row Level Security (RLS) Strategy

## Status
Accepted

## Context
Security and data isolation are critical in a multi-tenant or multi-role logistics application.

## Decision
- Enable RLS on all 57 database tables.
- Use `SECURITY DEFINER` functions for role checks (`has_role`) to prevent recursive policy calls and performance degradation.
- All access (SELECT, INSERT, UPDATE, DELETE) must be explicitly allowed by a policy.

## Consequences
- Robust data isolation at the database level.
- Centralized access control logic.

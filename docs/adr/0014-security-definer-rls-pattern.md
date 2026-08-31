# ADR 0014: SECURITY DEFINER Functions as First-Class RLS Building Blocks

## Status
Accepted — 2026-07-12

## Context
The Supabase database linter emits **57 `0028/0029` warnings** flagging `SECURITY DEFINER`
functions in the `public` schema that are executable by `anon` and/or `authenticated`
roles (e.g. `public.has_role(uuid, app_role)`, `public.get_query_regressions_fast()`,
`public.snapshot_query_baseline()`).

These are **false positives for our architecture**:

1. **`has_role` is the RLS foundation.** Every policy in the system that discriminates by
   role (`admin`, `moderator`, `user`) calls `public.has_role(auth.uid(), 'admin')`.
   If `has_role` were `SECURITY INVOKER`, each policy check would recursively trigger
   RLS on `user_roles`, causing infinite recursion — the exact anti-pattern documented in
   ADR 0002.

2. **Row-level access is enforced inside each function.** Every SECURITY DEFINER function
   validates `auth.uid()` and role membership before returning data. The function's
   privilege elevation is scoped to reading the check tables (`user_roles`,
   `pg_stat_statements`), not to bypassing user isolation.

3. **Revoking `EXECUTE` from `anon`/`authenticated` breaks the app.** RLS policies would
   fail to evaluate, the frontend would receive `permission denied for function`, and
   every authenticated route would 500.

## Decision
- **Accept the 57 linter warnings as design intent.** They are reviewed on every audit,
  not silenced globally.
- **New `SECURITY DEFINER` functions must document why in a header comment**, e.g.:
  ```sql
  -- SECURITY DEFINER: required so RLS policies on <table> can call this without
  -- recursing into their own policy set. Function validates auth.uid() internally.
  ```
- **Grant strategy:** `EXECUTE` is granted narrowly — `authenticated` for user-facing
  checks, `service_role` for admin/cron operations. `anon` gets `EXECUTE` only on
  functions that legitimately support unauthenticated flows (e.g. `public.has_role`
  is called from policies evaluated for `anon` too).
- **Search path is always pinned** via `SET search_path = public` to prevent search-path
  injection (`CVE-2018-1058` class).

## Consequences
- Auditors can distinguish accepted warnings from new drift by cross-referencing this ADR.
- Any *new* SECURITY DEFINER function without a justification comment fails PR review.
- The 57-warning baseline is tracked in `docs/PERFEICAO_10_10.md`; increases above 57
  require a follow-up ADR.

## References
- ADR 0002 — RLS Strategy
- ADR 0011 — Query Baseline & Defensive Timeouts
- Supabase docs: https://supabase.com/docs/guides/database/database-linter

# 2.13 — XP pelo front (add_user_xp)

- **Problema**: migrations 20260711183644:42 e 20260711192237:25 revogaram EXECUTE
  de authenticated para add_user_xp; nenhuma migration posterior reconcedeu.
  `useGamification.ts:159` (addXP) + onboarding (`useOnboarding.tsx:148`) falham com
  "permission denied for function add_user_xp".
- **Fix**: migration 20261120120000 reconcede o grant (replay-safe, idempotente).
- **Status**: resolvido (migration pendente de aplicação em produção — aguardando dono)
- **Verificado**: assinatura da função conferida; grant idêntico ao original
  (migration 20260314203713:64). Aplicação em produção fica para PR dedicada (regra 8).

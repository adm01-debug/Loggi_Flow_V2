# 2.7 — FretesInternos consulta deleted_at em fretes_internos (sem coluna)

- **Problema**: `.is('deleted_at', null)` em tabela sem coluna deleted_at.
- **Fix**: remover filtro inválido; usar soft delete real se houver (validar).
- **Status**: resolvido
- **Verificado**: Fix PR #212: removido .is('deleted_at', null) em FretesInternos.tsx, Relatorios.tsx, useDrillDown.tsx (tabela sem coluna deleted_at). typecheck/eslint/build verdes.

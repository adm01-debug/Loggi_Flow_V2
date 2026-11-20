# 2.6 — nexus-auto-healing usa data_coleta_efetiva (inexistente)

- **Problema**: coluna real é `data_efetiva_coleta`; o auto-healing referencia
  `data_coleta_efetiva` → healing não toca coletas.
- **Fix**: renomear para coluna real em supabase/functions/nexus-auto-healing/index.ts.
- **Status**: resolvido
- **Verificado**: fix em main via #211 (merged 2026-11-20).
  - `nexus-auto-healing/index.ts:54,60,67`: usa `data_efetiva_coleta` (coluna real —
    criada em `20251215123841_69fdc13e...sql:55`, presente em
    `src/components/coletas/types.ts:20`, `PickupDetailsDialog.tsx:83,94`,
    `Relatorios.tsx:87`, `useKPIBenchmark.tsx:60`, types gerados `:1346,1379,1412`).
  - `data_coleta_efetiva` só existe como alias de export em `useExport.tsx:257` (coluna de planilha).
  - typecheck/eslint/build verdes na PR.

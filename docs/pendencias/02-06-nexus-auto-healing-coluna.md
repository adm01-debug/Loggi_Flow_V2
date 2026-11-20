# 2.6 — nexus-auto-healing usa data_coleta_efetiva (inexistente)

- **Problema**: coluna real é `data_efetiva_coleta`; o auto-healing referencia
  `data_coleta_efetiva` → healing não toca coletas.
- **Fix**: renomear para coluna real em supabase/functions/nexus-auto-healing/index.ts.
- **Status**: pendente

# 3.22 — MapaRotas time travel

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que era falso**: `src/pages/MapaRotas.tsx:266-285,71,157-172` posições históricas inventadas (time travel) e último sync inventado.
- **Correção (PR #242)**: markers usam lat/lng reais da rota, removida interpolação temporal do histórico e último sync inventado; slider temporal segue filtrando apenas logs reais.
- **Verificação**: `tsc --noEmit` 0 erros, `eslint` 0 erros, CI verde, merge em `main` (0f32426a), deploy de produção confirmado.
- **Status**: CONCLUÍDO (2026-11-21)

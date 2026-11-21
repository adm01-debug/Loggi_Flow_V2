# 3.15 — DashboardExecutivo alertas/metas fixos

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que era falso**: `src/pages/DashboardExecutivo.tsx:337-377` 'Alertas Preditos (IA)' e 'Metas em Foco' textos fixos ("Obras na BR-116…", "economia de 12%", "92.4%"); queries sem tratamento de loading/erro/vazio.
- **Resolução**: 'Alertas Preditos' passou a usar `useRecentAlerts` (alerta real, com loading/vazio/erro honestos via componente `AlertasPreditosCard`); 'Metas em Foco' usa `kpis.otifRate`/`kpis.targetOtif` reais (`MetasEmFocoCard`).
- **Evidência**: PR #239 (`73b5d8cc`) — CI 100% verde (Lint, Type Check, Tests, Budget, quality-gate, Devin Review) e deploy de produção "Deployment has completed".
- **Status**: CONCLUÍDO

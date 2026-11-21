# 3.18 — InteligenciaFrete 'Ações Corretivas' estáticas

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que era falso**: `src/pages/InteligenciaFrete.tsx:613-680` 'Ações Corretivas' estáticas (`+40%`, `R$ 4.200`) e 4 botões sem `onClick`.
- **Resolução**: card real com `abusiveFreights[0]` (transportadora/estado/valor acima da média) e oportunidade de consolidação (`consolidationOpportunities`/`summary.consolidationSavings`), com botões navegando para as abas 'abusivos'/'consolidacao'; estados honestos quando vazios. Tabs controladas (`activeTab`/`onValueChange`).
- **Evidência**: PR #240 (`d15ef794`) — CI 100% verde e deploy de produção "Deployment has completed".
- **Status**: CONCLUÍDO

# 3.16 — CotacaoFrete 'Economia Garantida' fixa

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que era falso**: `src/pages/CotacaoFrete.tsx:231-256` card 'Economia Garantida' com `R$ 12.450,00` / `- R$ 3.120,00` fixos.
- **Resolução**: useMemo `quotationStats` derivado de `flow.quotationResults` (melhor, média e economia reais); card usa `formatCurrency`; sem resultado → estado honesto ("Faça uma cotação para ver a economia possível").
- **Evidência**: PR #239 (`73b5d8cc`) — CI 100% verde e deploy de produção "Deployment has completed".
- **Status**: CONCLUÍDO

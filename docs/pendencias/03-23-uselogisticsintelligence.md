# 3.23 — useLogisticsIntelligence otif simulado

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que era falso**: `src/hooks/logistics/useLogisticsIntelligence.tsx:18,31` otif=92 // Simulated, highVolumeSP=true; botão "Iniciar Processamento" sem onClick.
- **Correção (PR #243)**: `healthScore` passou a usar `metrics.otifRate` real (RPC `get_dashboard_metrics`); otimização dinâmica agora depende de `alertasCriticos + coletasAtrasadas >= 3` reais, descrevendo esses números em vez do gargalo SP fabricado (4 veículos/2h11).
- **Verificação**: `tsc --noEmit` 0 erros, `eslint` 0 erros, `lint:budget` 103/105. CI 100% verde, merge em `main` (13c9e3f5), deploy de produção completado.
- **Status**: CONCLUÍDO (2026-11-21)

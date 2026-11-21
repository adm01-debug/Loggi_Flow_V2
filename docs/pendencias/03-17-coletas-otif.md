# 3.17 — Coletas OTIF simulado

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que era falso**: `src/pages/Coletas.tsx` OTIF "simulado", `leadTime: "18.4h" // Simulado`, gráfico semanal inline, badges e mini-barras literais.
- **Resolução**: lead time real (`data_recebimento - data_prevista_coleta`, média em horas, `—` sem dado); agregação semanal real por dia (OTIF, volume, divergência) a partir de `created_at`; mini-barras e AreaChart consomem a agregação; badge `ESTÁVEL`/`SEM DADO` conforme métrica.
- **Evidência**: PR #240 (`d15ef794`) — CI 100% verde e deploy de produção "Deployment has completed".
- **Status**: CONCLUÍDO

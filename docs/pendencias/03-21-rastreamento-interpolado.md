# 3.21 — RastreamentoRealTime posição interpolada

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que era falso**: `src/pages/RastreamentoRealTime.tsx:145-160,712` posição do caminhão interpolada por fator fixo; velocidade 48 km/h e GPS EXCELENTE fixos.
- **Correção (PR #242)**: marker do truck só com coordenadas GPS reais (`entregas.latitude/longitude`), popup com número/status/previsao reais e rótulo honesto de telemetria; removidas velocidade inventada e GPS fixo.
- **Verificação**: `tsc --noEmit` 0 erros, `eslint` 0 erros, CI verde, merge em `main` (0f32426a), deploy de produção confirmado.
- **Status**: CONCLUÍDO (2026-11-21)

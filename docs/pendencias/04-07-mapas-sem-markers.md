# 4.7 — Mapas sem onMarkerClick

- **Origem**: seção 4 (blocos) da auditoria 2026-11-20.
- **Estado real**: CONCLUÍDO via PR #258 (`fa1afdb0`, 2026-11-21).
- **O que foi feito**: `MapaRotas.tsx` agora passa `onMarkerClick` e, ao clicar num marcador, abre painel "Rota Selecionada" com protocolo, destino, cliente, status e botão "Abrir Tracking" (navega para `/rastreamento/<id>`). `RastreamentoRealTime.tsx` passa `onMarkerClick` e mostra badge do veículo/destino selecionado. Nada simulado — estados reais.
- **Verificação**: `tsc --noEmit` 0 erros, eslint limpo, warning budget dentro, CI verde, merge em `main` (fa1afdb0), deploy de produção confirmado.
- **Status**: CONCLUÍDO (2026-11-21)

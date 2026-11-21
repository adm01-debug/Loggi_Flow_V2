# 3.11 — PickupConference OCR simulado

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que é falso**: `src/components/coletas/PickupConference.tsx` executava setTimeout(1,5s) que fabricava extração OCR e preenchia os campos automaticamente com '98% de precisão'.
- **Estado real**: a extração automática real **não está implementada** — a edge function `ocr-receipt-processor` está marcada `not_implemented` (upload fica para revisão manual). O texto '98% de precisão' era inventado.
- **Camadas**: front (componente de coleta).
- **Aceite**: sem espera falsa nem percentual de precisão inventado; quando a extração automática não existe, mostrar estado honesto e prosseguir para a conferência manual; zero warnings novos.
- **Status**: CONCLUÍDO em 2026-11-21 via PR #235 (commit `e7cd1b44`).
- **Resolução**: `onScanUnavailable` substitui `simulateOCR`: avisa em toast que a extração automática via OCR ainda não está implementada e prossegue imediatamente para a entrada manual blindada (sem setTimeout, sem preenchimento automático, sem número de precisão). Texto do cartão de scan atualizado para refletir o comportamento real.
- **Evidência**: `npx tsc --noEmit` limpo; eslint dos 3 arquivos com 0 erros/0 warnings; `node scripts/check-warning-budget.mjs` OK (104/105); CI completa verde; deploy de produção confirmado em `e7cd1b44` ("Deployment has completed").

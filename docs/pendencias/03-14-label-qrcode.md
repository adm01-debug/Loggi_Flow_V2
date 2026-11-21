# 3.14 — MaterialLabelPrinter PDF com placeholder

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que era falso**: `src/components/labels/MaterialLabelPrinter.tsx` PDF com texto placeholder no lugar do QR Code.
- **Resolução**: QR Code real gerado via `qrcode.react` (mesma lib do preview em tela) como data URL e embutido no PDF via `addImage`; Código/NF reposicionados ao lado do QR.
- **Evidência**: PR #237 (`df04cb6c`) — CI verde e deploy em produção "Deployment has completed".
- **Status**: CONCLUÍDO

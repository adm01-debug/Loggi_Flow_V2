# 2.16 — MissionDetail consulta integracoes_bitrix inexistente

- **Problema**: tabela não existe; cai em mockTimeline (mentira ao usuário).
- **Fix**: remover consulta inválida e fonte real do timeline.
- **Status**: resolvido
- **Verificado**: fix em main via #211 — consulta a `integracoes_bitrix` removida;
  timeline passa a derivar do status real do shipment (`MissionDetail.tsx:33-71`).

# 3.13 — CinematicHUD telemetria fixa

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que era falso**: `src/components/map/CinematicHUD.tsx` telemetria e coordenadas fixas (SAT_LOCK: 14_FIXED, HDOP: 0.82, Grid_Reference_X_245).
- **Resolução**: commit `84f200d7` (PR #228) removeu a telemetria e as coordenadas fixas; HUD agora exibe apenas estados honestos (GPS_ATIVO/RESTORED, SINAL_OK ou horário do último sync) sem números inventados.
- **Evidência**: PR #228 mergeada (`84f200d7`); deploy em produção confirmado.
- **Status**: CONCLUÍDO

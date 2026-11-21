# 4.8 — Deep link sem handler

- **Origem**: seção 4 (blocos) da auditoria 2026-11-20.
- **Estado real**: fórmula pronta e PR aberta — #259 (`23b83482`, branch `claude/fix-fase-c-0408-deeplink-261121-1457`).
- **O que foi feito**: `CentralRastreamento.tsx` agora lê `searchParams` (`?entrega=<id>` ou `?coleta=<id>`), localiza o shipment por `id` ou `numero` e navega direto para `/rastreamento/<id>`, limpando a query. `predict-delays-scheduled` grava `action_url=/central-rastreamento?<tipo>=<id>`, então o clique na notificação abre a remessa certa.
- **Verificação**: `tsc --noEmit` 0 erros, eslint limpo, warning budget dentro. CI da PR #259 em andamento.
- **Status**: PR aberta (aguardando CI) — 2026-11-21

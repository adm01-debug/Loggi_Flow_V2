# 3.20 — DashboardCotacoes "Simular Resposta WA" insere dado falso

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que é falso**: botão "Simular Resposta WA" (`src/pages/DashboardCotacoes.tsx:280-330`)
  insere uma cotação `status:"pendente"` com transportadora fixa e texto fixo em
  `cotacoes_multicanal` — dado de teste misturado com dado real; listagem mostra `[Simulado]`
  em log vazio, e `toast("Retentativa disparada!")` sem ação (`.tsx:625-631`).
- **Estado real**: PARCIAL — a inserção grava na tabela real (dado poluído), mas nada é "resposta
  de gateway".
- **Camadas**: front (`DashboardCotacoes.tsx`).
- **Raio de impacto**: `CotacaoMultiCanal` (3.19), listagem de cotações.
- **Aceite**: remover botão/simulação; se UX de retentativa existir, implementar call à função
  real (`nexus-webhook-receiver`/gateway) ou remover.
- **Status**: inventariado (aguarda código).

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
- **Status**: CONCLUÍDO em 2026-11-20 via PR #226 (commit `e4392b7d`).
- **Resolução**: botão "Simular Resposta WA" removido (inseria linha fake em tabela real de
  produção com transportadora_id hardcoded). "Forçar Retentativa" agora incrementa `retry_count`
  e anexa ação em `workflow_logs` via `updateCotacao` (colunas já existentes) em vez de só toast.
  Empty-state de logs não diz mais "[Simulado]".
- **Evidência**: `npm run typecheck` limpo; eslint 0 erros; PR mergeada sem bloqueio.

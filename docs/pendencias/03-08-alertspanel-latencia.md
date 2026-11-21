# 3.8 — AlertsPanel latência fixa

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que é falso**: `src/components/dashboard/AlertsPanel.tsx:419` exibia 'Processamento em Tempo Real (8ms latência)' fixo, sem medição real.
- **Estado real**: NÃO havia medição; o valor `8ms` era inventado.
- **Camadas**: front (componente de dashboard).
- **Aceite**: exibir latência medida de verdade ou estado honesto sem número; zero warnings novos.
- **Status**: CONCLUÍDO em 2026-11-21 via PR #233 (commit `a1e670f7`).
- **Resolução**: o rodapé agora consome o hook `useNexusHealth` (já existente, criado na Fase B 3.3/3.4), que mede a latência real via round-trip do canal realtime do Supabase (timeout 4s). A label exibe `Processamento em Tempo Real (${latency}ms latência)` quando há medição e `Processamento em Tempo Real` (sem número, estado honesto) quando ainda não mediu/falhou.
- **Evidência**: `npx tsc --noEmit` limpo; eslint dos 2 arquivos com 0 erros/0 warnings; `node scripts/check-warning-budget.mjs` OK (104/105); CI completa verde; deploy de produção confirmado em `a1e670f7` ("Deployment has completed").

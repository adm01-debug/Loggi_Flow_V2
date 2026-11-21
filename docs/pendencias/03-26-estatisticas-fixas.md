# 3.26 — estatísticas fixas em 3 telas

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que era falso**: IntegracaoBitrix.tsx:181, ConfiguracoesFrete.tsx:418, ConciliacaoAutomatica.tsx:248: 'Latência média: 145ms', '94.8% OPTIMIZED', 'Conciliação 100%' fixos.
- **Correção (PR #245)**: IntegracaoBitrix mostra o último log real de `bitrix_sync_logs` (data + status) com fallback honesto; ConfiguracoesFrete mostra a contagem real de `regioes_atendidas` da transportadora; ConciliacaoAutomatica calcula o percentual real de conciliados sobre `matchResults`.
- **Verificação**: `tsc --noEmit` 0 erros, `eslint` 0 erros, `npm run lint:budget` OK (103/105), CI 100% verde (inclui Lint/Type Check/Testes/Build/quality-gate), merge em `main` (ba49b7b1), deploy de produção confirmado (loggi-flow-v2.vercel.app HTTP 200).
- **Status**: CONCLUÍDO (2026-11-21)

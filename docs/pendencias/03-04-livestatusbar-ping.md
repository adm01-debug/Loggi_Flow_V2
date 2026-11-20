# 3.4 — LiveStatusBar com ping random walk

- **Origem**: seção 3 (SIMULADO) da auditoria 2026-11-20.
- **O que é falso**: `src/components/dashboard/LiveStatusBar.tsx:27-33,57` usa random walk para 'Ping', não é medição real.
- **Estado real**: NÃO VERIFICADO ainda (na Fase 1, conferir no código antes de executar).
- **Camadas**: a definir na verificação.
- **Aceite**: a definir na verificação.
- **Status**: CONCLUÍDO em 2026-11-20 via PR #229 (commit `b6710412`).
- **Resolução**: substituídos os valores literais/locais por fontes reais das RPCs de
  observabilidade existentes (health/mttr/suggestions/remediation_actions e edge
  `health-check`); quando não há dado, o widget mostra estado honesto (—/empty-state)
  em vez de número fabricado. Nenhuma migration necessária; contratos dos hooks de
  `db-observability` inalterados.
- **Evidência**: `npx tsc --noEmit` limpo; eslint dos 6 arquivos tocados com 0 erros e 0
  warnings novos (o único restante em `LogisticsMapWidget.tsx:175` é pré-existente em
  main e já conta no baseline); `npm run lint:budget` OK (104/105 warnings); CI completa
  verde (Lint, Type Check, Warning Budget Gate, Unit & Integration Tests, Security Scan,
  Dependency Review, quality-gate, Devin Review); deploy de produção confirmado em
  `d952137` ("Deployment has completed").

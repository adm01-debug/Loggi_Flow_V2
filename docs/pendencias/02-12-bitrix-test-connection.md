# 2.12 — bitrix24-integration sem action `test-connection`

- **Problema**: useIntegrationValidation.tsx envia `{action:'test-connection'}`;
  handler bitrix não trata → responde 400 "Unknown action" e Validação de Integração
  mostra Bitrix24 como erro mesmo com credenciais válidas.
- **Fix**: adicionar ação `test-connection` (sem side-effect) no handler bitrix.
- **Status**: resolvido
- **Verificado**: fix em main via #211 — action `test-connection` tratada em
  `bitrix24-integration/index.ts:55`; `useIntegrationValidation.tsx:66` segue enviando-a.

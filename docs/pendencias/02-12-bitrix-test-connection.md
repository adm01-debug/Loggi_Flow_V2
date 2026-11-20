# 2.12 — bitrix24-integration sem action `test-connection`

- **Problema**: useIntegrationValidation.tsx envia `{action:'test-connection'}`;
  handler bitrix não trata → responde 400 "Unknown action" e Validação de Integração
  mostra Bitrix24 como erro mesmo com credenciais válidas.
- **Fix**: adicionar ação `test-connection` (sem side-effect) no handler bitrix.
- **Status**: pendente
- **Verificado**: pendente de execução

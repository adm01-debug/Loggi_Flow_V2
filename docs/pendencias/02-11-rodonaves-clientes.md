# 2.11 — Gestão de clientes Rodonaves (RTECustomerManager)

- **Problema**: front chamava actions inexistentes (`get-customer-by-key`,
  `get-customer-full`, `list-customers`, `list-customer-addresses`); shape de
  resposta errado (`data.Result` em vez de `data.data`); botões "Novo" endereço e
  "Buscar por ID" sem handler.
- **Fix**: usar as actions reais do rodonaves-api (`customer-search`,
  `customer-search-full`, `customer-list`, `customer-get-by-taxid`,
  `customer-get-by-id`, `address-list`, `address-create`), ler o wrapper
  `{ success, data }`, implementar busca por ID e form completo de novo endereço
  (CRIAR via `address-create`).
- **Status**: resolvido
- **Verificado**: typecheck/eslint verdes nesta PR; validação estática e manual pendentes no passo 3.

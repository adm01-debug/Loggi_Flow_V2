# 2.15 — Rodonaves: CNPJ remetente padrão

- **Problema**: `requireString(params, "cnpjRemetente", { minLength: 11 })` lança
  ValidationError antes do fallback `|| cnpjDefault` em 6 pontos (index.ts:853,865,
  878,900,976,1052) — o secret RODONAVES_CNPJ_REMETENTE nunca era usado.
- **Fix**: helper `resolveCnpj(params)` que usa o param ou o default e só valida
  quando ambos ausentes/curtos.
- **Status**: resolvido
- **Verificado**: 6 chamadas substituídas; typecheck/eslint verdes nesta PR.

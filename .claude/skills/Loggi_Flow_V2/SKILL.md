---
name: loggi-flow-v2-conventions
description: Convenções de código e commit do Loggi Flow V2 (TypeScript, Conventional Commits). Use ao alterar código, criar testes ou escrever mensagem de commit neste repositório; as regras operacionais ficam em AGENTS.md.
---

# Loggi Flow V2 — convenções

As regras de trabalho (banco, fluxo Git, PR, deploy, comunicação) estão em `AGENTS.md` na raiz e em
`docs/agentes/*.md` — este skill só resume convenções de código e commit.

## Commits

Padrão Conventional Commits (`@commitlint/config-conventional`, configurado em `.commitlintrc.json`):
`<tipo>(<escopo>): <descrição>` — escopo opcional e minúsculo, assunto curto no imperativo e sem ponto
final. Mensagem em PT-BR.

**Nada executa o commitlint neste repo**: `.husky/` só tem `pre-commit` (`npx lint-staged`). O padrão é
responsabilidade de quem commita.

Exemplo: `fix(coletas): corrige status que travava em conferencia_ok`

## Código

- TypeScript: front Vite + React 18 em `src/`, edge functions Deno em `supabase/functions/`.
- **Páginas e componentes**: arquivo `PascalCase.tsx`; páginas usam `export default`, componentes seguem o
  padrão do vizinho.
- **Hooks**: `use<Algo>.ts(x)` com **export nomeado**, dentro da pasta de domínio
  (`src/hooks/logistics/`, `integrations/`, `gamification/`, `security/`, …).
- Funções `camelCase`, tipos/classes/componentes `PascalCase`, constantes `SCREAMING_SNAKE_CASE`.
- Import por alias `@/` (`@/hooks/...`, `@/components/...`), nunca caminho relativo longo.
- Dados do servidor via **TanStack Query**, com chave vinda de `src/lib/queryKeys.ts` e opções de
  `queryConfig.ts` — não invente chave solta.
- Validação com **Zod** (`src/lib/schemas/`, `supabase/functions/_shared/schemas/`).
- `src/integrations/supabase/types.ts` é **gerado** — nunca editar à mão.
- Em edge function: use `_shared/` (`logger.ts` em vez de `console.*`, `cors.ts`, `auth.ts`,
  `webhookSignature.ts`, `rateLimiter.ts`, `circuitBreaker.ts`) — o CI reprova `console.*` cru.
- Nada de query sem filtrar `deleted_at IS NULL` em tabela com soft delete.

## Testes

- Centralizados em `tests/`: `unit/`, `integration/`, `security/`, `contracts/`, `fuzzing/`, `load/`,
  `e2e/` (Playwright, fora do vitest). Testes de utilitário também aparecem ao lado do módulo em `src/`
  (`*.test.ts`) — os dois caminhos estão no `include` do `vitest.config.ts`.
- Rode só o que tocou: `npx vitest run <caminho>`. A suíte completa (`npm run test:coverage`) tem piso de
  cobertura que **sobe, nunca desce**.
- `vitest.config.ts` é a config válida; o bloco `test:` do `vite.config.ts` é morto (aponta para um
  `setupFiles` que não existe).

## Lint

`npx eslint <arquivos>` nos arquivos tocados. O gate do CI é **orçamento**, não zero:
`.warning-budget.json` (`lintWarnings: 105`, `lintErrors: 0`, `tsErrors: 0`) — erro novo reprova, warning
novo acima do orçamento reprova. Baixar o orçamento é bem-vindo (`npm run lint:budget:ratchet`); subir é
decisão do dono.

Siga os padrões já existentes no módulo; não desvie sem motivo registrado na PR.

# ADR 0001: Strict TypeScript and Data Integrity
**Data:** 2026-05-13 | **Status:** Implementado

## Contexto
O sistema lidava com cálculos monetários usando floats nativos, causando imprecisões. Além disso, o TypeScript estava com o modo estrito desativado.

## Decisão
- Ativado `strict: true` (com correção gradual de erros de build).
- Adicionado `Decimal.js` para cálculos financeiros.
- Configurado Husky + lint-staged para qualidade no commit.

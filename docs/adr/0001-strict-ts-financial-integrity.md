---
name: ADR 0001: Strict TypeScript and Data Integrity
description: Decisão de ativar modo estrito do TS e garantir precisão decimal para cálculos financeiros.
date: 2026-05-13
---

## Contexto
O sistema lidava com cálculos monetários usando floats nativos, causando imprecisões. Além disso, o TypeScript estava com o modo estrito desativado, permitindo `any` implícitos e falta de null safety.

## Decisão
1. Ativado `strict: true` em `tsconfig.json`.
2. Adicionado `Decimal.js` para todos os cálculos financeiros.
3. Configurado Husky + lint-staged para garantir qualidade no commit.

## Consequências
- Aumento da segurança de tipos e redução de bugs de runtime.
- Precisão absoluta em auditorias de frete.
- Build pode falhar inicialmente até que todos os erros de tipagem sejam corrigidos.
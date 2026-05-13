# ADR 0003: Validação Runtime e Schemas Compartilhados
**Data:** 2026-05-13 | **Status:** Implementado

## Contexto
Falta de sincronia entre validações frontend e backend.

## Decisão
- Schemas Zod centralizados em `src/lib/schemas/`.
- Sincronização via `import_map.json` para as Edge Functions Deno.

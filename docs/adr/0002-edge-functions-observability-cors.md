# ADR 0002: Observabilidade e Segurança de Edge Functions
**Data:** 2026-05-13 | **Status:** Implementado

## Contexto
Logs amorfos e CORS permissivo dificultavam o monitoramento e segurança das Edge Functions.

## Decisão
- Criado `_shared/logger.ts` para logs JSON estruturados.
- Criado `_shared/cors.ts` com restrição por `ALLOWED_ORIGINS`.
- Configuração centralizada em `supabase/config.toml`.

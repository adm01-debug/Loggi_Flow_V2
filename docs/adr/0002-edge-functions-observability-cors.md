---
name: ADR 0002: Observabilidade e Segurança de Edge Functions
description: Padronização de logs estruturados e restrição de CORS para o backend.
date: 2026-05-13
---

## Contexto
As Edge Functions utilizavam `console.log` plano e CORS liberado (`*`), o que dificultava o monitoramento e expunha endpoints desnecessariamente.

## Decisão
1. Criado utilitário `_shared/logger.ts` para logs JSON estruturados.
2. Criado utilitário `_shared/cors.ts` que respeita a variável de ambiente `ALLOWED_ORIGINS`.
3. Iniciada a migração das funções para utilizar esses padrões.

## Consequências
- Logs agora podem ser filtrados por nível e contexto via Supabase Logs.
- Maior controle sobre quais domínios podem invocar o backend.
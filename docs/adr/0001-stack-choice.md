# ADR 0001: Escolha da Stack Tecnológica (LogiFlow)

## Status
Aceito (Meta 10/10)

## Contexto
O LogiFlow precisava de uma arquitetura robusta, escalável e de rápida iteração para gerenciar logística complexa (Lalamove, Rodonaves, Melhor Envio) com segurança enterprise.

## Decisão
Adotamos:
- **Frontend**: React 18 + Vite (Performance e Ecossistema).
- **Estilo**: TailwindCSS + shadcn/ui (Consistência e Velocidade).
- **Estado/Cache**: React Query 5 (Gerenciamento de cache assíncrono).
- **Backend/DB**: Supabase (Postgres + Auth + RLS + Edge Functions).
- **Linguagem**: TypeScript Strict (Segurança de tipo).

## Consequências
- Alta produtividade.
- Segurança nativa via RLS.
- Facilidade de manutenção modular.

# ADR 0001: Escolha da Stack Tecnológica

## Status
Aceito

## Contexto
O projeto LogiFlow (Promo Brindes) necessita de uma arquitetura escalável, segura e de rápida evolução para gerenciar logística complexa (Lalamove, Rodonaves, Melhor Envio) e integração com CRM (Bitrix24).

## Decisão
Utilizar a stack:
- **Frontend:** React 18 + Vite + TypeScript (Tipagem estrita).
- **Estilização:** TailwindCSS + shadcn/ui (Componentes acessíveis e consistentes).
- **Gerenciamento de Estado/Cache:** React Query (TanStack Query) v5.
- **Backend/DB:** Lovable Cloud / Supabase (PostgreSQL + RLS + Edge Functions).
- **Comunicação:** Edge Functions Deno para segurança de chaves de API.

## Consequências
- Alta produtividade no desenvolvimento.
- Segurança nativa via Row Level Security (RLS).
- Facilidade de integração com APIs externas via serverless.

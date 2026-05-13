# ADR 0001: Escolha da Stack Tecnológica (LogiFlow)

## Status
Aceito

## Contexto
O projeto LogiFlow (Promo Brindes) necessitava de uma stack moderna para gerenciar logística complexa com múltiplas transportadoras (Lalamove, Rodonaves, Melhor Envio), integração com CRM (Bitrix24) e suporte a PWA com alta performance.

## Decisões
- **Frontend:** React 18 + Vite 5 + TypeScript 5 + Tailwind v3. Escolhido pela performance de build, tipagem forte e ecossistema de UI (shadcn/ui).
- **Backend:** Lovable Cloud (Supabase). Escolhido pela rapidez de desenvolvimento, autenticação nativa, RLS (Row Level Security) e Edge Functions para integrações.
- **Gerenciamento de Estado:** React Query v5. Escolhido como fonte única de verdade para dados assíncronos e cache.

## Consequências
- Alta produtividade no desenvolvimento de features.
- Garantia de segurança via banco de dados (RLS).
- Facilidade de deploy e manutenção via Lovable Cloud.

# ADR 0001: Escolha da Stack Tecnológica

## Data
2026-05-13

## Status
Aceito

## Contexto
O projeto LogiFlow necessitava de uma stack moderna, escalável e de rápido desenvolvimento para gestão logística e transportadoras.

## Decisão
- **Frontend:** React 18 com Vite 5 e TypeScript 5 para máxima performance e segurança de tipos.
- **UI:** TailwindCSS 3 e shadcn/ui para design consistente e responsivo.
- **Gerenciamento de Estado:** React Query 5 (TanStack Query) para cache de dados assíncronos e sincronização de estado servidor-cliente.
- **Backend/DB:** Supabase (PostgreSQL) para persistência, autenticação nativa e Row Level Security (RLS).
- **Edge Functions:** Deno (TypeScript) para lógica de negócio isolada, integração com APIs externas e processamento assíncrono.
- **Comunicação:** Resend (Email) e Evolution/A-Ticket (WhatsApp) para notificações.

## Consequências
- **Prós:** Desenvolvimento acelerado, segurança nativa no banco de dados, tipagem forte fim-a-fim.
- **Contras:** Dependência da infraestrutura do Supabase e Deno Deploy (mitigada pela portabilidade do PostgreSQL).

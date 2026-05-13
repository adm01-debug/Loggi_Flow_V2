# ADR 0001: Escolha da Stack Tecnológica

## Data: 2026-05-13
## Status: Aceito

## Contexto
O projeto LogiFlow requer uma interface reativa, alta performance de entrega e integração com múltiplos provedores logísticos e de CRM.

## Decisão
- **Frontend**: React 18 com Vite 5 para máxima performance de build e HMR.
- **Estilização**: Tailwind CSS + shadcn/ui para consistência visual e velocidade de desenvolvimento.
- **Gerenciamento de Estado**: React Query v5 para cache de servidor, reduzindo chamadas redundantes à API.
- **Backend/DB**: Lovable Cloud (Supabase) pela facilidade de RLS, Edge Functions e escalabilidade PostgreSQL.

## Consequências
- Curva de aprendizado moderada para novos desenvolvedores familiarizados com o ecossistema moderno de React.
- Dependência de serviços gerenciados (Cloud-native), facilitando manutenção.

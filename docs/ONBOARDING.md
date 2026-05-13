# Onboarding do Desenvolvedor (LogiFlow 10/10)

## Checklist Inicial (Objetivo: < 4h)
1. **Clone**: git clone <repo>
2. **Dependências**: bun install
3. **Ambiente**: cp .env.example .env (solicitar secrets ao admin)
4. **Local DB**: supabase start (requer Docker)
5. **Seeds**: supabase db reset (aplica migrations + seeds)
6. **Vite**: bun dev

## Padrões de Código
- Máximo 400 linhas por arquivo (ESLint enforced).
- React Query para todos os estados assíncronos.
- Hooks para lógica de negócio, Componentes para UI.

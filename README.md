# 🚚 Loggi-Flow

[![CI/CD](https://github.com/adm01-debug/loggi-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/adm01-debug/loggi-flow/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e.svg)](https://supabase.com/)

Sistema completo de gestão logística com gamificação, desenvolvido em React + TypeScript + Supabase.

## ✨ Funcionalidades

### 📦 Gestão de Operações
- **Coletas** - Gestão completa de coletas com status em tempo real
- **Envios** - Controle de entregas com rastreamento
- **Ocorrências** - Registro e acompanhamento de problemas
- **Fretes Internos** - Movimentações entre unidades
- **Despachos** - Kanban para gestão de expedição

### 🏆 Gamificação
- Sistema de XP e níveis
- Conquistas desbloqueáveis
- Ranking de operadores
- Loja de recompensas com moedas virtuais
- Streak de dias consecutivos

### 📊 Analytics & IA
- Dashboard em tempo real
- Relatórios customizáveis
- Previsão de atrasos com IA
- Métricas de SLA

### 🔧 Funcionalidades Técnicas
- ✅ Paginação avançada
- ✅ Filtros dinâmicos
- ✅ Ordenação multi-coluna
- ✅ Ações em lote (Bulk Actions)
- ✅ Realtime updates via Supabase
- ✅ Exportação CSV/JSON
- ✅ Dark mode
- ✅ PWA ready

## 🚀 Tecnologias

- **Frontend:** React 18, TypeScript, Vite
- **UI:** Tailwind CSS, Shadcn/UI, Framer Motion
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage)
- **State:** TanStack Query (React Query)
- **Charts:** Recharts
- **Testes:** Vitest, Testing Library

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/adm01-debug/loggi-flow.git

# Instale as dependências
cd loggi-flow
npm install

# Configure as variáveis de ambiente
cp .env.example .env

# Inicie o servidor de desenvolvimento
npm run dev
```

## 🧪 Scripts

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run test         # Executar testes
npm run test:ui      # Testes com UI
npm run test:coverage # Cobertura de testes
npm run lint         # Linting
npm run typecheck    # Verificação de tipos
```

## 📁 Estrutura

```
src/
├── components/       # Componentes reutilizáveis
│   ├── common/      # Pagination, FilterBar, BulkActions...
│   ├── dashboard/   # KPIs, Charts, Rankings
│   ├── layout/      # MainLayout, Header, Sidebar
│   └── ui/          # Shadcn/UI components
├── hooks/           # Custom hooks (48 hooks)
│   ├── usePagination
│   ├── useFilters
│   ├── useSorting
│   ├── useRealtime
│   └── ...
├── pages/           # Páginas da aplicação (30 páginas)
├── integrations/    # Supabase client
└── test/            # Testes unitários
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adicionar nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

MIT © Promo Brindes

---

## 📋 Auditoria e Relatórios

Para garantir a transparência e integridade do sistema, mantemos relatórios de auditoria atualizados:

- [📄 Relatório de Auditoria (Markdown)](./audit_report.md) - Versão técnica detalhada.
- [📥 Relatório de Auditoria (PDF)](./audit_report.pdf) - Versão para exportação e apresentações.

*Os relatórios são gerados automaticamente pelo nosso pipeline de CI/CD.*

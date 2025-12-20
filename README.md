# 🚚 Loggi Flow

Sistema de gestão logística com gamificação para empresas de brindes promocionais.

![React](https://img.shields.io/badge/React-18.3-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-cyan)

## 📋 Funcionalidades

### Gestão Logística
- **Coletas**: Gerenciamento de coletas em fornecedores
- **Entregas**: Controle de entregas para clientes
- **Fretes Internos**: Movimentação interna entre unidades
- **Transportadoras**: Cadastro e ranking de transportadoras
- **Ocorrências**: Registro e resolução de problemas

### Gamificação
- **Sistema de XP**: Ganhe pontos ao completar tarefas
- **Níveis**: Evolua conforme acumula experiência
- **Conquistas**: Desbloqueie badges especiais
- **Ranking**: Compete com a equipe
- **Moedas**: Sistema de recompensas

### Dashboards
- **KPIs em tempo real**: OTIF, SLA, taxa de ocorrências
- **Gráficos interativos**: Volume, status, performance
- **Alertas inteligentes**: Notificações de problemas
- **Rastreamento**: Integração com Lalamove

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Supabase

### Instalação

```bash
# Clonar repositório
git clone https://github.com/adm01-debug/loggi-flow.git
cd loggi-flow

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Supabase

# Executar migrations
npx supabase db push

# Iniciar desenvolvimento
npm run dev
```

### Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run preview      # Preview build
npm run test         # Executar testes
npm run lint         # Verificar código
```

## 🏗️ Arquitetura

```
src/
├── components/       # Componentes React
│   ├── common/       # Componentes reutilizáveis
│   ├── dashboard/    # Componentes do dashboard
│   ├── layout/       # Layout (Header, Sidebar)
│   ├── notifications/# Sistema de notificações
│   └── ui/           # shadcn/ui components
├── hooks/            # React hooks customizados
├── integrations/     # Integrações (Supabase)
├── lib/              # Utilitários e validações
├── pages/            # Páginas da aplicação
└── test/             # Testes automatizados

supabase/
├── functions/        # Edge Functions
└── migrations/       # Migrações do banco
```

## 📊 Banco de Dados

### Principais Tabelas
- `coletas` - Ordens de coleta
- `entregas` - Ordens de entrega
- `clientes` - Cadastro de clientes
- `fornecedores` - Cadastro de fornecedores
- `transportadoras` - Cadastro de transportadoras
- `ocorrencias` - Registro de ocorrências
- `user_levels` - Níveis e XP dos usuários
- `achievements` - Conquistas disponíveis
- `notifications` - Sistema de notificações

## 🔧 Configuração

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
```

### Supabase Secrets (Edge Functions)

```bash
supabase secrets set LALAMOVE_API_KEY=xxx
supabase secrets set LALAMOVE_API_SECRET=xxx
supabase secrets set MAPBOX_ACCESS_TOKEN=xxx
```

## 🧪 Testes

```bash
# Executar todos os testes
npm run test

# Executar com coverage
npm run test:coverage

# Executar em watch mode
npm run test:watch
```

## 📦 Tecnologias

- **Frontend**: React 18, TypeScript, Vite
- **Estilização**: Tailwind CSS, shadcn/ui
- **Estado**: TanStack Query, Zustand
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **Mapas**: Mapbox GL
- **Gráficos**: Recharts
- **Testes**: Vitest, Testing Library

## 📚 Documentação Adicional

- [Configuração de Integrações](./docs/INTEGRACAO_CONFIG.md)
- [Melhorias Implementadas](./docs/MELHORIAS.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é privado e proprietário.

## 👥 Equipe

Desenvolvido por **Promo Brindes** - Sistema interno de gestão logística.

---

**Loggi Flow** - Transformando logística em jogo! 🎮🚚

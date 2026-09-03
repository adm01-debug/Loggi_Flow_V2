# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.1.0] - 2026-09-02

### Segurança
- Autenticação obrigatória em 5 edge functions que aceitavam chamadas sem verificação de usuário
- Testes de RLS passam a usar a anon key correta do projeto atual (antes usavam a key de um projeto antigo e passavam sem testar nada)

### Corrigido
- `npm ci` restaurado com eslint 9 (major 10 revertido — plugins ainda não suportam)
- 9 erros de typecheck causados por mudanças de API em bumps major de dependências
- CVEs de severidade alta corrigidos via `npm audit fix`

### Alterado
- CI sem steps que dependiam de secrets inexistentes (SonarCloud, Slack, PDF de auditoria)
- Gate de tamanho de bundle ajustado para o build real (8192 KB; lazy chunks carregados sob demanda)
- Sentry agora é opcional, habilitado via `VITE_SENTRY_DSN`

### Banco
- Migrations de remediação registradas no histórico versionado
- Policy de RLS criada em partição futura
- Índices adicionados em foreign keys sem cobertura

## [1.0.0] - 2024-12-21

### Adicionado
- 🎉 Lançamento inicial do Loggi-Flow
- 📦 Gestão completa de Coletas
- 🚚 Gestão de Envios/Entregas
- ⚠️ Sistema de Ocorrências com comentários e fotos
- 🏢 Cadastro de Clientes, Fornecedores e Transportadoras
- 📊 Dashboard com métricas em tempo real
- 🏆 Sistema de Gamificação (XP, Níveis, Conquistas)
- 🛒 Loja de Recompensas
- 📈 Relatórios e Analytics
- 🤖 Previsão de atrasos com IA
- 🔔 Sistema de notificações
- 🌙 Dark mode
- 📱 Design responsivo (Mobile-first)

### Funcionalidades Técnicas
- ✅ Paginação em todas as listagens
- ✅ Filtros dinâmicos multi-campo
- ✅ Ordenação por múltiplas colunas
- ✅ Ações em lote (Bulk Actions)
- ✅ Atualizações em tempo real (Realtime)
- ✅ Exportação CSV/JSON
- ✅ Timeline de histórico
- ✅ Upload de imagens
- ✅ Comentários em ocorrências

### Testes
- 🧪 Testes unitários para hooks principais
- 🧪 Testes de componentes (Pagination, FilterBar)
- 🔄 CI/CD com GitHub Actions

## [0.9.0] - 2024-12-15

### Adicionado
- Sistema de autenticação com Supabase
- Perfil de usuário com avatar
- Configurações do sistema

## [0.8.0] - 2024-12-10

### Adicionado
- Kanban de Despachos
- Rastreamento público

## [0.7.0] - 2024-12-05

### Adicionado
- Sistema de conquistas
- Ranking de operadores

## [0.6.0] - 2024-11-28

### Adicionado
- Fretes Internos
- API Documentation (/api-docs)

## [0.5.0] - 2024-11-20

### Adicionado
- Ocorrências com fotos
- Comentários em tempo real

## [0.4.0] - 2024-11-15

### Adicionado
- Transportadoras
- Integração Lalamove

## [0.3.0] - 2024-11-10

### Adicionado
- Clientes e Fornecedores
- Validação de CNPJ

## [0.2.0] - 2024-11-05

### Adicionado
- Dashboard inicial
- Gráficos de performance

## [0.1.0] - 2024-11-01

### Adicionado
- Setup inicial do projeto
- Configuração Vite + React + TypeScript
- Integração Supabase
- UI base com Shadcn/UI

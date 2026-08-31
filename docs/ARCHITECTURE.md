# 🏗️ Arquitetura do Loggi-Flow

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Pages   │  │Components│  │  Hooks   │  │ State Management │ │
│  │  (30)    │  │  (117)   │  │  (48)    │  │  (TanStack Query)│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
│       │             │             │                  │           │
│       └─────────────┴─────────────┴──────────────────┘           │
├─────────────────────────────────────────────────────────────────┤
│                     Supabase Client SDK                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE (Backend)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │PostgreSQL│  │   Auth   │  │ Realtime │  │     Storage      │ │
│  │  (14 TB) │  │          │  │  (WS)    │  │    (Buckets)     │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
│  ┌──────────────────────────────────────────────────────────────┤
│  │              Edge Functions (Deno)                           │ │
│  │  - Previsão de atrasos (IA)                                  │ │
│  │  - Notificações push                                         │ │
│  │  - Webhooks                                                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Estrutura de Diretórios

```
src/
├── components/
│   ├── common/          # Componentes reutilizáveis
│   │   ├── Pagination.tsx
│   │   ├── FilterBar.tsx
│   │   ├── BulkActions.tsx
│   │   ├── DateRangePicker.tsx
│   │   ├── Timeline.tsx
│   │   ├── CommentSection.tsx
│   │   └── ImageUploader.tsx
│   ├── dashboard/       # Componentes de dashboard
│   ├── layout/          # Layout principal
│   ├── notifications/   # Sistema de notificações
│   ├── predictions/     # Componentes de IA
│   └── ui/             # Shadcn/UI components
│
├── hooks/              # Custom hooks (48)
│   ├── usePagination.ts
│   ├── useFilters.ts
│   ├── useSorting.ts
│   ├── useRealtime.ts
│   ├── useComments.ts
│   ├── useImageUpload.ts
│   ├── useEntityHistory.ts
│   ├── useGamification.ts
│   ├── useExport.ts
│   └── ...
│
├── pages/              # Páginas (30)
│   ├── Index.tsx       # Dashboard
│   ├── Coletas.tsx
│   ├── Envios.tsx
│   ├── Ocorrencias.tsx
│   ├── Clientes.tsx
│   ├── Fornecedores.tsx
│   ├── Transportadoras.tsx
│   ├── FretesInternos.tsx
│   ├── Despachos.tsx
│   ├── Ranking.tsx
│   ├── Conquistas.tsx
│   ├── Loja.tsx
│   ├── Relatorios.tsx
│   └── ...
│
├── integrations/
│   └── supabase/
│       ├── client.ts   # Supabase client
│       └── types.ts    # TypeScript types
│
└── test/              # Testes unitários
    ├── usePagination.test.ts
    ├── useFilters.test.ts
    ├── useSorting.test.ts
    └── ...
```

## Fluxo de Dados

```
┌──────────────────────────────────────────────────────────────┐
│                      User Interaction                         │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    React Component                            │
│  - Renderiza UI                                               │
│  - Captura eventos                                            │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Custom Hooks                               │
│  - usePagination (paginação de dados)                        │
│  - useFilters (filtragem dinâmica)                           │
│  - useSorting (ordenação)                                    │
│  - useRealtime (updates em tempo real)                       │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                   TanStack Query                              │
│  - Cache automático                                           │
│  - Mutations otimistas                                        │
│  - Invalidação inteligente                                    │
└──────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                    Supabase Client                            │
│  - Queries (select, insert, update, delete)                  │
│  - Subscriptions (realtime)                                   │
│  - Storage (upload de arquivos)                               │
└──────────────────────────────────────────────────────────────┘
```

## Banco de Dados (PostgreSQL)

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfis de usuários |
| `coletas` | Coletas de fornecedores |
| `entregas` | Entregas para clientes |
| `ocorrencias` | Registro de problemas |
| `clientes` | Cadastro de clientes |
| `fornecedores` | Cadastro de fornecedores |
| `transportadoras` | Cadastro de transportadoras |
| `fretes_internos` | Movimentações internas |
| `user_levels` | Níveis de gamificação |
| `achievements` | Conquistas desbloqueáveis |
| `rewards` | Recompensas da loja |
| `comments` | Comentários em entidades |
| `notifications` | Notificações do sistema |
| `activity_logs` | Logs de atividades |

## Padrões de Código

### Hooks Padrão

Todo hook de listagem segue este padrão:

```typescript
const { data, isLoading, error, refetch } = useQuery({...});
const { filteredData, filters, setFilter, clearFilters } = useFilters(data, config);
const { sortedData, toggleSort, getSortDirection } = useSorting(filteredData, options);
const { paginatedData, currentPage, totalPages, goToPage } = usePagination(sortedData);
const { selectedIds, toggle, selectAll, clearSelection } = useSelection(paginatedData);
```

### Componentes de Listagem

Toda página de listagem inclui:
1. **Header** com título e botão de ação
2. **Stats cards** com métricas
3. **FilterBar** para busca e filtros
4. **Sorting buttons** para ordenação
5. **BulkActions** para ações em lote
6. **Grid/Table** com dados paginados
7. **Pagination** no rodapé
8. **Dialogs** para CRUD

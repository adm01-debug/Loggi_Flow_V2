# Documentação de Hooks e Componentes Reutilizáveis

Este documento descreve a assinatura correta de todos os hooks e componentes utilitários do projeto para evitar erros de tipagem e uso incorreto.

---

## Sumário

1. [useFilters](#usefilters)
2. [usePagination](#usepagination)
3. [useSorting](#usesorting)
4. [useSelection](#useselection)
5. [FilterBar](#filterbar)
6. [Pagination](#pagination)
7. [BulkActions](#bulkactions)
8. [Exemplos de Uso Completo](#exemplos-de-uso-completo)

---

## useFilters

**Arquivo:** `src/hooks/useFilters.ts`

Hook para gerenciar filtros de busca, status, data e filtros customizados.

### Interface de Configuração

```typescript
interface FilterConfig<T> {
  search?: {
    fields: (keyof T)[];        // Campos para busca textual
    placeholder?: string;        // Placeholder do input (opcional)
  };
  dateRange?: {
    field: keyof T;              // Campo de data para filtrar
    label?: string;              // Label do date picker (opcional)
  };
  status?: {
    field: keyof T;              // Campo de status
    options: { value: string; label: string }[];  // Opções de status
    label?: string;              // Label do select (opcional)
  };
  select?: {
    [key: string]: {             // Filtros customizados por chave
      field: keyof T;
      options: { value: string; label: string }[];
      label?: string;
    };
  };
}
```

### Interface de Retorno

```typescript
interface UseFiltersReturn<T> {
  filters: FilterState;          // Estado atual dos filtros
  filteredData: T[];             // Dados filtrados
  setSearch: (value: string) => void;
  setDateRange: (value: DateRange | undefined) => void;
  setStatus: (value: string) => void;
  setFilter: (key: string, value: any) => void;  // Para filtros customizados
  clearFilters: () => void;
  hasActiveFilters: boolean;
  totalFiltered: number;
  totalOriginal: number;
}
```

### Exemplo de Uso

```typescript
import { useFilters } from "@/hooks/useFilters";

// ✅ CORRETO: config é um OBJETO, não um array
const filterConfig: FilterConfig<Cliente> = {
  search: {
    fields: ["razao_social", "nome_fantasia", "cnpj"],
    placeholder: "Buscar cliente..."
  },
  status: {
    field: "estado",
    options: [
      { value: "SP", label: "São Paulo" },
      { value: "RJ", label: "Rio de Janeiro" }
    ]
  }
};

const {
  filters,
  filteredData,
  setSearch,
  setStatus,
  clearFilters,
  hasActiveFilters,
  totalFiltered,
  totalOriginal
} = useFilters(clientes, filterConfig);

// ❌ ERRADO: NÃO use array
const filterConfig = [
  { key: "status", ... },
  { key: "estado", ... }
];
```

---

## usePagination

**Arquivo:** `src/hooks/usePagination.ts`

Hook para gerenciar paginação de dados.

### Interface de Opções

```typescript
interface UsePaginationOptions {
  initialPage?: number;          // Página inicial (default: 1)
  initialPageSize?: number;      // Itens por página (default: 10)
  pageSizeOptions?: number[];    // Opções de tamanho (default: [5, 10, 20, 50, 100])
}
```

### Interface de Retorno

```typescript
interface UsePaginationReturn<T> {
  // Estado
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  
  // Dados paginados
  paginatedData: T[];
  
  // Ações
  setPage: (page: number) => void;      // ⚠️ NÃO existe goToPage!
  setPageSize: (size: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  
  // Info
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startIndex: number;
  endIndex: number;
  pageSizeOptions: number[];
}
```

### Exemplo de Uso

```typescript
import { usePagination } from "@/hooks/usePagination";

const {
  currentPage,
  pageSize,
  totalPages,
  totalItems,
  paginatedData,
  setPage,           // ✅ Use setPage
  setPageSize,
  nextPage,
  prevPage,
  firstPage,
  lastPage,
  hasNextPage,
  hasPrevPage,
  startIndex,
  endIndex,
  pageSizeOptions
} = usePagination(filteredData, { initialPageSize: 10 });

// ✅ CORRETO
setPage(5);

// ❌ ERRADO: goToPage não existe!
goToPage(5);
```

---

## useSorting

**Arquivo:** `src/hooks/useSorting.ts`

Hook para gerenciar ordenação de dados.

### Interface de Opções

```typescript
type SortDirection = "asc" | "desc" | null;

interface UseSortingOptions<T> {
  defaultKey?: keyof T;           // Chave padrão para ordenar
  defaultDirection?: SortDirection;  // Direção padrão
}
```

### Interface de Retorno

```typescript
interface UseSortingReturn<T> {
  sortedData: T[];
  sortState: {
    key: keyof T | null;
    direction: SortDirection;
  };
  toggleSort: (key: keyof T) => void;
  setSort: (key: keyof T | null, direction: SortDirection) => void;
  clearSort: () => void;
  getSortDirection: (key: keyof T) => SortDirection;
}
```

### Exemplo de Uso

```typescript
import { useSorting } from "@/hooks/useSorting";

const {
  sortedData,
  sortState,
  toggleSort,
  setSort,
  clearSort,
  getSortDirection
} = useSorting(data, { 
  defaultKey: "created_at", 
  defaultDirection: "desc" 
});

// Usar em um header de tabela
<th onClick={() => toggleSort("nome")}>
  Nome {getSortDirection("nome") === "asc" ? "↑" : getSortDirection("nome") === "desc" ? "↓" : ""}
</th>
```

---

## useSelection

**Arquivo:** `src/components/common/BulkActions.tsx` (exportado junto com BulkActions)

Hook para gerenciar seleção de itens.

### Interface de Retorno

```typescript
interface UseSelectionReturn {
  selectedIds: string[];
  toggle: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  isAllSelected: boolean;
  isPartialSelected: boolean;
}
```

### Exemplo de Uso

```typescript
import { useSelection } from "@/components/common/BulkActions";

// ⚠️ Itens devem ter { id: string }
const {
  selectedIds,
  toggle,
  selectAll,
  clearSelection,
  isSelected,
  isAllSelected,
  isPartialSelected
} = useSelection(items);

// Uso em checkbox
<Checkbox 
  checked={isSelected(item.id)} 
  onCheckedChange={() => toggle(item.id)} 
/>
```

---

## FilterBar

**Arquivo:** `src/components/common/FilterBar.tsx`

Componente de barra de filtros.

### Props

```typescript
interface FilterBarProps {
  // Busca (OBRIGATÓRIO)
  search: string;                          // ⚠️ NÃO é searchValue!
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // Status (opcional)
  status?: string;
  onStatusChange?: (value: string) => void;
  statusOptions?: { value: string; label: string }[];
  statusLabel?: string;
  
  // Data (opcional)
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  
  // Filtros extras (opcional)
  extraFilters?: {
    key: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    label: string;
  }[];
  
  // Controle (opcional)
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  
  // Contagem (opcional)
  totalFiltered?: number;
  totalOriginal?: number;
  
  className?: string;
}
```

### Exemplo de Uso

```typescript
import { FilterBar } from "@/components/common/FilterBar";

<FilterBar
  search={filters.search}              // ✅ CORRETO: search
  onSearchChange={setSearch}
  searchPlaceholder="Buscar..."
  status={filters.status}
  onStatusChange={setStatus}
  statusOptions={[
    { value: "ativo", label: "Ativo" },
    { value: "inativo", label: "Inativo" }
  ]}
  hasActiveFilters={hasActiveFilters}
  onClearFilters={clearFilters}
  totalFiltered={totalFiltered}
  totalOriginal={totalOriginal}
/>

// ❌ ERRADO: searchValue não existe!
<FilterBar searchValue={...} />
```

---

## Pagination

**Arquivo:** `src/components/common/Pagination.tsx`

Componente de paginação.

### Props (TODAS OBRIGATÓRIAS)

```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  startIndex: number;              // ⚠️ OBRIGATÓRIO
  endIndex: number;                // ⚠️ OBRIGATÓRIO
  hasNextPage: boolean;
  hasPrevPage: boolean;
  pageSizeOptions: number[];       // ⚠️ OBRIGATÓRIO
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onNextPage: () => void;          // ⚠️ OBRIGATÓRIO
  onPrevPage: () => void;          // ⚠️ OBRIGATÓRIO
  onFirstPage: () => void;         // ⚠️ OBRIGATÓRIO
  onLastPage: () => void;          // ⚠️ OBRIGATÓRIO
}
```

### Exemplo de Uso

```typescript
import { Pagination } from "@/components/common/Pagination";
import { usePagination } from "@/hooks/usePagination";

const pagination = usePagination(data, { initialPageSize: 10 });

// ✅ CORRETO: Passar TODAS as props
<Pagination
  currentPage={pagination.currentPage}
  totalPages={pagination.totalPages}
  totalItems={pagination.totalItems}
  pageSize={pagination.pageSize}
  startIndex={pagination.startIndex}
  endIndex={pagination.endIndex}
  hasNextPage={pagination.hasNextPage}
  hasPrevPage={pagination.hasPrevPage}
  pageSizeOptions={pagination.pageSizeOptions}
  onPageChange={pagination.setPage}
  onPageSizeChange={pagination.setPageSize}
  onNextPage={pagination.nextPage}
  onPrevPage={pagination.prevPage}
  onFirstPage={pagination.firstPage}
  onLastPage={pagination.lastPage}
/>

// ❌ ERRADO: Faltando props obrigatórias
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setPage}
/>
```

---

## BulkActions

**Arquivo:** `src/components/common/BulkActions.tsx`

Componente para ações em massa.

### Props

```typescript
interface BulkAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "destructive";
  onClick: (selectedIds: string[]) => void;
}

interface BulkActionsProps {
  selectedIds: string[];
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll?: () => void;
  actions: BulkAction[];
  className?: string;
}
```

### Exemplo de Uso

```typescript
import { BulkActions, useSelection } from "@/components/common/BulkActions";
import { Trash2, Download } from "lucide-react";

const selection = useSelection(items);

<BulkActions
  selectedIds={selection.selectedIds}
  totalCount={items.length}
  onClearSelection={selection.clearSelection}
  onSelectAll={selection.selectAll}
  actions={[
    {
      id: "export",
      label: "Exportar",
      icon: Download,
      onClick: (ids) => handleExport(ids)
    },
    {
      id: "delete",
      label: "Excluir",
      icon: Trash2,
      variant: "destructive",
      onClick: (ids) => handleDelete(ids)
    }
  ]}
/>
```

---

## Exemplos de Uso Completo

### Página com Filtros, Paginação, Ordenação e Seleção

```typescript
import { useState } from "react";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { usePagination } from "@/hooks/usePagination";
import { useSorting } from "@/hooks/useSorting";
import { FilterBar } from "@/components/common/FilterBar";
import { Pagination } from "@/components/common/Pagination";
import { BulkActions, useSelection } from "@/components/common/BulkActions";

interface Item {
  id: string;
  nome: string;
  status: string;
  created_at: string;
}

export function MinhaPageCompleta() {
  const [data, setData] = useState<Item[]>([]);
  
  // 1. Configurar filtros (OBJETO, não array!)
  const filterConfig: FilterConfig<Item> = {
    search: {
      fields: ["nome"],
      placeholder: "Buscar por nome..."
    },
    status: {
      field: "status",
      options: [
        { value: "ativo", label: "Ativo" },
        { value: "inativo", label: "Inativo" }
      ]
    }
  };
  
  // 2. Usar hooks na ordem correta
  const {
    filters,
    filteredData,
    setSearch,
    setStatus,
    clearFilters,
    hasActiveFilters,
    totalFiltered,
    totalOriginal
  } = useFilters(data, filterConfig);
  
  const { sortedData, toggleSort, getSortDirection } = useSorting(filteredData, {
    defaultKey: "created_at",
    defaultDirection: "desc"
  });
  
  const pagination = usePagination(sortedData, { initialPageSize: 10 });
  const selection = useSelection(pagination.paginatedData);
  
  return (
    <div>
      {/* Filtros */}
      <FilterBar
        search={filters.search}
        onSearchChange={setSearch}
        status={filters.status}
        onStatusChange={setStatus}
        statusOptions={filterConfig.status?.options}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
        totalFiltered={totalFiltered}
        totalOriginal={totalOriginal}
      />
      
      {/* Ações em Massa */}
      <BulkActions
        selectedIds={selection.selectedIds}
        totalCount={pagination.totalItems}
        onClearSelection={selection.clearSelection}
        onSelectAll={selection.selectAll}
        actions={[
          { id: "delete", label: "Excluir", onClick: handleDelete }
        ]}
      />
      
      {/* Tabela */}
      <table>
        <thead>
          <tr>
            <th onClick={() => toggleSort("nome")}>
              Nome {getSortDirection("nome")}
            </th>
          </tr>
        </thead>
        <tbody>
          {pagination.paginatedData.map(item => (
            <tr key={item.id}>
              <td>
                <Checkbox
                  checked={selection.isSelected(item.id)}
                  onCheckedChange={() => selection.toggle(item.id)}
                />
                {item.nome}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Paginação - TODAS as props! */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        pageSize={pagination.pageSize}
        startIndex={pagination.startIndex}
        endIndex={pagination.endIndex}
        hasNextPage={pagination.hasNextPage}
        hasPrevPage={pagination.hasPrevPage}
        pageSizeOptions={pagination.pageSizeOptions}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
        onNextPage={pagination.nextPage}
        onPrevPage={pagination.prevPage}
        onFirstPage={pagination.firstPage}
        onLastPage={pagination.lastPage}
      />
    </div>
  );
}
```

---

## Checklist de Erros Comuns

| Erro | Causa | Correção |
|------|-------|----------|
| `searchValue` não existe | Prop errada | Use `search` |
| `goToPage` não existe | Método errado | Use `setPage` |
| `FilterConfig` espera objeto | Passando array | Use objeto `{ search: {...}, status: {...} }` |
| Props faltando em Pagination | Não passou todas | Passe `startIndex`, `endIndex`, `pageSizeOptions`, `onNextPage`, etc. |
| `key` não existe em FilterConfig | Estrutura errada | FilterConfig não usa `key`, use campos nomeados |

---

## Atualizações

| Data | Versão | Descrição |
|------|--------|-----------|
| 2025-12-22 | 1.0.0 | Documentação inicial |

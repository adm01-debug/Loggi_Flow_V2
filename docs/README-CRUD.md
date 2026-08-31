# 📚 Documentação CRUD - Loggi-Flow

## 🎯 Visão Geral

Este documento descreve os componentes e hooks CRUD implementados no Loggi-Flow.

## 📦 Hooks Disponíveis

### useSavedFilters
Gerencia filtros salvos por usuário.
```tsx
const { filters, saveFilter, deleteFilter, setDefault } = useSavedFilters('entregas');
```

### useVersions
Versionamento de entidades.
```tsx
const { versions, createVersion, restoreVersion } = useVersions('contratos', contractId);
```

### useDuplicate
Duplicação de registros.
```tsx
const { mutate: duplicate } = useDuplicate('entregas', ['entregas']);
```

### useInfiniteScroll
Scroll infinito com IntersectionObserver.
```tsx
const { data, setLoadMoreRef, hasNextPage } = useInfiniteScroll('entregas', ['entregas']);
```

### useFulltextSearch
Busca fulltext em múltiplas colunas.
```tsx
const { data } = useFulltextSearch('clientes', searchTerm, ['nome', 'email']);
```

### useSoftDelete
Soft delete com restore.
```tsx
const { softDelete, restore, permanentDelete } = useSoftDelete('entregas', ['entregas']);
```

### useBulkActions
Ações em lote.
```tsx
const { selectedIds, toggle, bulkDelete, bulkUpdate } = useBulkActions({ table: 'entregas', queryKey: ['entregas'] });
```

### useActivityLog
Log de atividades.
```tsx
const { logs, logActivity } = useActivityLog('entregas', entregaId);
```

## 🧩 Componentes Disponíveis

### SavedFiltersDropdown
Dropdown para filtros salvos.

### CSVImporter / ExcelImporter
Import de dados CSV/Excel com validação Zod.

### DataImporter
Componente universal que suporta CSV e Excel.

### DataExporter
Export para CSV, Excel e JSON.

### VersionHistory
Timeline de versões.

### TrashBin
Lixeira com restore.

### ActivityTimeline
Timeline de atividades.

### AdvancedFilter
Filtros avançados com múltiplas condições.

### DuplicateDialog
Dialog para duplicação com opções.

### InfiniteList
Lista com scroll infinito.

## 📊 Migrations SQL

1. `saved_filters` - Filtros salvos por usuário
2. `entity_versions` - Versionamento de entidades
3. `activity_logs` - Log de atividades

## 🚀 Uso Típico

```tsx
import { usePagination, useFilters, useSorting, useSavedFilters, useBulkActions } from '@/hooks';
import { FilterBar, Pagination, SavedFiltersDropdown, DataExporter, TrashBin } from '@/components/common';

function EntregasPage() {
  const { data, refetch } = useQuery({ queryKey: ['entregas'], queryFn: fetchEntregas });
  const { filteredData, filters, setFilter } = useFilters(data, filterConfig);
  const { sortedData, toggleSort } = useSorting(filteredData);
  const { paginatedData, currentPage, goToPage } = usePagination(sortedData);
  const { filters: savedFilters, saveFilter } = useSavedFilters('entregas');
  const { selectedIds, toggle, bulkDelete } = useBulkActions({ table: 'entregas', queryKey: ['entregas'] });

  return (
    <div>
      <FilterBar ... />
      <SavedFiltersDropdown entityType="entregas" ... />
      <DataExporter data={sortedData} filename="entregas" />
      <TrashBin table="entregas" queryKey={['entregas']} displayField="numero_nf" />
      <Pagination ... />
    </div>
  );
}
```

// CRUD Toolkit - Índice de Exports

// Hooks
export { useCRUD } from '@/hooks/useCRUD';
export { useSavedFilters } from '@/hooks/useSavedFilters';
export { useFulltextSearch } from '@/hooks/useFulltextSearch';
export { useDebounce } from '@/hooks/useDebounce';
export { useDuplicate } from '@/hooks/useDuplicate';
export { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
export { useBulkActions } from '@/hooks/useBulkActions';
export { useSoftDelete } from '@/hooks/useSoftDelete';

// Components
export { DataImporter } from '@/components/DataImporter';
export { SavedFiltersDropdown } from '@/components/SavedFiltersDropdown';
export { AdvancedFilter } from '@/components/common/AdvancedFilter';
export { SearchInput } from '@/components/SearchInput';
export { BulkActionsBar } from '@/components/BulkActionsBar';
export { VersionHistory } from '@/components/common/VersionHistory';
export { Pagination } from '@/components/common/Pagination';
export { EmptyState } from '@/components/common/EmptyState';
export { ConfirmDialog } from '@/components/common/ConfirmDialog';
export { StatusBadge } from '@/components/common/StatusBadge';
export { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Utilities
export { importCSV, generateCSVTemplate } from '@/lib/csvImporter';
export { importExcel, exportToExcel } from '@/lib/excelImporter';

// Types
export type { FilterValue, FilterConfig } from '@/components/common/AdvancedFilter';

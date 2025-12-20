// Common Components Index

// Data Display
export { DataTable } from "./DataTable";
export type { Column } from "./DataTable";

// Status & Badges
export { StatusBadge, getStatusLabel, getStatusColor, statusOptions } from "./StatusBadge";

// Empty & Error States
export { 
  EmptyState, 
  EmptySearchResult, 
  EmptyList,
  EmptyClientes,
  EmptyFornecedores,
  EmptyTransportadoras,
  EmptyOcorrencias,
  EmptyNotifications,
  EmptyRanking,
  EmptyConfig,
  ErrorState 
} from "./EmptyState";

// Dialogs
export { 
  ConfirmDialog, 
  ConfirmProvider, 
  useConfirm, 
  DeleteButton 
} from "./ConfirmDialog";

// Export
export { ExportButton } from "./ExportButton";

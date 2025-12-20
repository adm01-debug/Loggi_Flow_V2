// Common Components Index - Complete

// Data Display
export { DataTable } from "./DataTable";
export type { Column } from "./DataTable";

// Status & Badges
export { StatusBadge, getStatusLabel, getStatusColor, statusOptions } from "./StatusBadge";

// Empty & Error States
export { EmptyState, EmptySearchResult, EmptyList, EmptyClientes, EmptyFornecedores, EmptyTransportadoras, EmptyOcorrencias, EmptyNotifications, EmptyRanking, ErrorState } from "./EmptyState";
export { ErrorBoundary, AsyncErrorBoundary, useErrorHandler } from "./ErrorBoundary";

// Dialogs & Confirmations
export { ConfirmDialog, ConfirmProvider, useConfirm, DeleteButton } from "./ConfirmDialog";

// Export
export { ExportButton } from "./ExportButton";

// Loading
export { LoadingSpinner, PageLoader, InlineLoader } from "./LoadingSpinner";

// Layout
export { PageHeader } from "./PageHeader";

// Helpers
export { TooltipWrapper } from "./TooltipWrapper";

// NEW: Pagination
export { Pagination } from "./Pagination";

// NEW: Filters
export { FilterBar } from "./FilterBar";
export { DateRangePicker, dateRangePresets } from "./DateRangePicker";

// NEW: Media
export { ImageUploader } from "./ImageUploader";

// NEW: Comments
export { CommentSection } from "./CommentSection";

// NEW: Stats
export { StatsCard, StatsGrid } from "./StatsCard";

// NEW: Timeline
export { Timeline, StatusTimeline } from "./Timeline";

// NEW: Search
export { SearchCommand } from "./SearchCommand";

// NEW: Tags
export { TagInput } from "./TagInput";

// NEW: Details
export { DetailSheet, createDetailSections } from "./DetailSheet";

// NEW: Bulk Actions
export { BulkActions, useSelection } from "./BulkActions";

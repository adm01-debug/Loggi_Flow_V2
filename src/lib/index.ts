// ============================================
// LIB - UTILITY EXPORTS
// ============================================

// Core Utilities
export { cn } from "./utils";

// Import/Export
export { importCSV, generateCSVTemplate, downloadCSV } from "./csvImporter";
export { importExcel, exportToExcel } from "./excelImporter";

// Formatters
export {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatCNPJ,
  formatCPF,
  formatPhone,
  formatCEP,
  truncate,
  capitalize,
  slugify,
  formatFileSize,
  formatDuration,
  formatHours,
} from "./formatters";

// Validations
export {
  validateCNPJDigits,
  clienteSchema,
  fornecedorSchema,
  transportadoraSchema,
  coletaSchema,
  entregaSchema,
  ocorrenciaSchema,
  freteInternoSchema,
  validateForm,
  formatCNPJ as formatCNPJInput,
  formatPhone as formatPhoneInput,
  formatCEP as formatCEPInput,
  type ClienteForm,
  type FornecedorForm,
  type TransportadoraForm,
  type ColetaForm,
  type EntregaForm,
  type OcorrenciaForm,
  type FreteInternoForm,
} from "./validations";

// Constants
export {
  ESTADOS_BR,
  UFS,
  TIPOS_FRETE,
  TIPOS_OCORRENCIA,
  XP_REWARDS,
  LEVEL_CONFIG,
  ACHIEVEMENT_RARITIES,
  SLA_CONFIG,
  PAGINATION,
  DATE_FORMATS,
  APP_CONFIG,
  API_ENDPOINTS,
  CHART_COLORS,
  KEYBOARD_SHORTCUTS,
} from "./constants";

// Query Configuration
export { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "./queryConfig";

// Status Transitions
export {
  TRANSICOES_ENTREGA,
  TRANSICOES_COLETA,
  podeTransicionarEntrega,
  podeTransicionarColeta,
} from "./statusTransitions";
export type { EntregaStatus, ColetaStatus } from "./statusTransitions";

// Travamento otimista (conflito de versao)
export { assertAtualizou, MENSAGEM_CONFLITO_VERSAO } from "./conflitoVersao";

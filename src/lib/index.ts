// ============================================
// LIB - UTILITY EXPORTS
// ============================================

// Core Utilities
export { cn } from './utils';

// Toast Utilities
export { premiumToast, advancedToast } from './toast';

// Import/Export
export { importCSV, generateCSVTemplate, downloadCSV } from './csvImporter';
export { importExcel, exportToExcel } from './excelImporter';

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
} from './formatters';

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
} from './validations';

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
} from './constants';

// Rodonaves Status Codes
export { RODONAVES_CODES, getSystemStatusFromCode } from './rodonavesStatusCodes';
export type { RodonavesStatusInfo } from './rodonavesStatusCodes';

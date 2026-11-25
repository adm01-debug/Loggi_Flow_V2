// Application Constants

// Estados brasileiros
export const ESTADOS_BR = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
] as const;

export const UFS = ESTADOS_BR.map(e => e.uf);

// Tipos de frete
export const TIPOS_FRETE = [
  { value: "cif", label: "CIF - Frete por conta do remetente" },
  { value: "fob", label: "FOB - Frete por conta do destinatário" },
  { value: "cortesia", label: "Cortesia - Sem cobrança" },
] as const;

// Tipos de ocorrência
export const TIPOS_OCORRENCIA = [
  { value: "atraso", label: "Atraso na Entrega" },
  { value: "avaria", label: "Avaria/Dano" },
  { value: "extravio", label: "Extravio" },
  { value: "endereco_incorreto", label: "Endereço Incorreto" },
  { value: "ausente", label: "Destinatário Ausente" },
  { value: "recusa", label: "Recusa de Recebimento" },
  { value: "documentacao", label: "Problema Documentação" },
  { value: "outros", label: "Outros" },
] as const;

// XP rewards
export const XP_REWARDS = {
  coleta_finalizada: 100,
  entrega_finalizada: 150,
  frete_interno: 50,
  ocorrencia_resolvida: 75,
  streak_bonus: 25, // per day
  level_up_coins: 50, // per level
} as const;

// Level thresholds
export const LEVEL_CONFIG = {
  base_xp: 100, // XP needed for level 2
  multiplier: 100, // XP = (level-1)² * multiplier
} as const;

// Achievement rarities
export const ACHIEVEMENT_RARITIES = {
  common: { label: "Comum", color: "text-muted-foreground", coins: 50, xp: 100 },
  rare: { label: "Raro", color: "text-info", coins: 200, xp: 500 },
  epic: { label: "Épico", color: "text-purple-500", coins: 500, xp: 1000 },
  legendary: { label: "Lendário", color: "text-warning", coins: 2000, xp: 5000 },
} as const;

// SLA thresholds (in hours)
export const SLA_CONFIG = {
  coleta_warning: 48,
  coleta_critical: 72,
  entrega_warning: 24,
  entrega_critical: 48,
  otif_target: 95, // percentage
  delivery_rate_target: 98, // percentage
  incident_rate_target: 1, // percentage (max)
} as const;

// Pagination
export const PAGINATION = {
  default_page_size: 10,
  page_size_options: [5, 10, 20, 50, 100],
} as const;

// Date formats
export const DATE_FORMATS = {
  display: "dd/MM/yyyy",
  display_time: "dd/MM/yyyy HH:mm",
  api: "yyyy-MM-dd",
  api_time: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

// App info
export const APP_CONFIG = {
  name: "Loggi Flow",
  version: "1.0.0",
  description: "Sistema de gestão logística com gamificação",
  company: "Promo Brindes",
} as const;

// API endpoints (for reference)
export const API_ENDPOINTS = {
  supabase: {
    coletas: "coletas",
    entregas: "entregas",
    clientes: "clientes",
    fornecedores: "fornecedores",
    transportadoras: "transportadoras",
    ocorrencias: "ocorrencias",
    user_levels: "user_levels",
    achievements: "achievements",
    notifications: "notifications",
  },
  edge_functions: {
    lalamove_tracking: "lalamove-tracking",
    lalamove_webhook: "lalamove-webhook",
    geocode_address: "geocode-address",
  },
} as const;

// Colors for charts
export const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  destructive: "hsl(var(--destructive))",
  info: "hsl(var(--info))",
  muted: "hsl(var(--muted))",
} as const;

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  search: { key: "k", ctrl: true, description: "Busca global" },
  dashboard: { key: "d", alt: true, description: "Dashboard" },
  coletas: { key: "c", alt: true, description: "Coletas" },
  entregas: { key: "e", alt: true, description: "Entregas" },
  settings: { key: "s", alt: true, description: "Configurações" },
  help: { key: "?", shift: true, description: "Ajuda" },
} as const;

import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

type DateInput = string | Date | null | undefined;
type NumberInput = number | null | undefined;
type StringInput = string | null | undefined;

// ===== DATE FORMATTERS =====

export function formatDate(
  date: DateInput,
  pattern: string = "dd/MM/yyyy",
): string {
  if (!date) return "-";
  const parsed = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsed)) return "-";
  return format(parsed, pattern, { locale: ptBR });
}

export function formatDateTime(date: DateInput): string {
  return formatDate(date, "dd/MM/yyyy HH:mm");
}

export function formatRelativeTime(date: DateInput): string {
  if (!date) return "-";
  const parsed = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsed)) return "-";
  return formatDistanceToNow(parsed, { addSuffix: true, locale: ptBR });
}

// ===== NUMBER FORMATTERS =====

export function formatCurrency(value: NumberInput): string {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatNumber(value: NumberInput, decimals: number = 0): string {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: NumberInput): string {
  if (value === null || value === undefined) return "-";
  return `${formatNumber(value, 1)}%`;
}

// ===== NUMBER PARSING =====

// Parses a string/number into a number, tolerating BR ("1.250,00") and US
// ("1,250.00") formats. Heuristic: the right-most separator is the decimal one.
// Note: an integer with only thousands separators ("1.250") is ambiguous and
// treated as decimal-less BR thousands only when no comma is present.
export function parseLocaleNumber(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  let s = String(input)
    .trim()
    .replace(/[^\d.,-]/g, "");
  if (!s) return null;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    s =
      lastComma > lastDot
        ? s.replace(/\./g, "").replace(",", ".") // BR: dot=thousands, comma=decimal
        : s.replace(/,/g, ""); // US: comma=thousands, dot=decimal
  } else if (lastComma > -1) {
    s = s.replace(/\./g, "").replace(",", "."); // only comma => decimal separator
  } // only dot or none => leave as-is
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

// ===== DOCUMENT FORMATTERS =====

export function formatCNPJ(value: StringInput): string {
  if (!value) return "-";
  const n = value.replace(/\D/g, "");
  if (n.length !== 14) return value;
  return n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function formatCPF(value: StringInput): string {
  if (!value) return "-";
  const n = value.replace(/\D/g, "");
  if (n.length !== 11) return value;
  return n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatPhone(value: StringInput): string {
  if (!value) return "-";
  const n = value.replace(/\D/g, "");
  if (n.length === 11) return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (n.length === 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return value;
}

export function formatCEP(value: StringInput): string {
  if (!value) return "-";
  const n = value.replace(/\D/g, "");
  if (n.length !== 8) return value;
  return n.replace(/(\d{5})(\d{3})/, "$1-$2");
}

// ===== TEXT FORMATTERS =====

export function truncate(text: StringInput, maxLength: number = 50): string {
  if (!text) return "-";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function capitalize(text: StringInput): string {
  if (!text) return "-";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// ===== FILE SIZE =====

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ===== DURATION =====

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export function formatHours(hours: number): string {
  if (hours < 24) return `${formatNumber(hours, 1)}h`;
  const days = Math.floor(hours / 24);
  const h = hours % 24;
  return h > 0 ? `${days}d ${formatNumber(h, 0)}h` : `${days}d`;
}

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

interface LogEntry {
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  meta?: Record<string, any>;
  timestamp: string;
}

export const log = (level: LogLevel | Omit<LogEntry, 'timestamp'>, message?: string, meta?: Record<string, any>) => {
  let entry: LogEntry;

  if (typeof level === 'string') {
    entry = {
      level: level as LogLevel,
      message: message || '',
      meta,
      timestamp: new Date().toISOString()
    };
  } else {
    entry = {
      ...(level as Omit<LogEntry, 'timestamp'>),
      timestamp: new Date().toISOString()
    };
  }
  
  const logStr = JSON.stringify(entry);
  
  if (entry.level === LogLevel.ERROR) {
    console.error(logStr);
  } else if (entry.level === LogLevel.WARN) {
    console.warn(logStr);
  } else {
    console.info(logStr);
  }
};

// Add convenience methods
log.info = (message: string, meta?: Record<string, any>) => log(LogLevel.INFO, message, meta);
log.warn = (message: string, meta?: Record<string, any>) => log(LogLevel.WARN, message, meta);
log.error = (message: string, meta?: Record<string, any>) => log(LogLevel.ERROR, message, meta);
log.debug = (message: string, meta?: Record<string, any>) => log(LogLevel.DEBUG, message, meta);

const MASK = "***";

function maskPII(value: string): string {
  return value
    .replace(/([^\s@]+)@([^\s@]+)/g, (_m: string, local: string) => `${String(local).slice(0, 2)}${MASK}@${MASK}`)
    .replace(/(\+?\d{1,3}[\s.-]?)?\(?\d{2,3}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}(?!\d)/g, MASK)
    .replace(/\d{3}\.\d{3}\.\d{3}-\d{2}/g, MASK)
    .replace(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g, MASK);
}

/** Recursively masks PII (e-mail, phone, CPF, CNPJ) inside strings and objects before logging. */
export function redact(value: unknown): unknown {
  if (typeof value === "string") return maskPII(value);
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      out[key] = redact((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

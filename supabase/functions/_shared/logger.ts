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

export const log = (entry: Omit<LogEntry, 'timestamp'>) => {
  const fullEntry: LogEntry = {
    ...entry,
    timestamp: new Date().toISOString()
  };
  
  // Structured JSON log for log management systems
  const logStr = JSON.stringify(fullEntry);
  
  if (entry.level === LogLevel.ERROR) {
    console.error(logStr);
  } else if (entry.level === LogLevel.WARN) {
    console.warn(logStr);
  } else {
    console.info(logStr);
  }
};

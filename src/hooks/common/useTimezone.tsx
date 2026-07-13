import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";

interface TimezoneContextType {
  timezone: string;
  setTimezone: (tz: string) => void;
  formatDate: (date: Date | string, formatStr?: string) => string;
  formatDateTime: (date: Date | string, formatStr?: string) => string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const TimezoneContext = createContext<TimezoneContextType | undefined>(
  undefined,
);

const TIMEZONE_KEY = "logiflow_timezone";

// eslint-disable-next-line react-refresh/only-export-components
export const defaultTimezone =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";

// eslint-disable-next-line react-refresh/only-export-components
export function createTimezoneFormatters(timezone: string) {
  const format = (
    date: Date | string,
    formatStr: string,
  ): string => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return "-";
      return formatInTimeZone(dateObj, timezone, formatStr, { locale: ptBR });
    } catch {
      return "-";
    }
  };
  return {
    formatDate: (date: Date | string, formatStr = "dd/MM/yyyy") =>
      format(date, formatStr),
    formatDateTime: (date: Date | string, formatStr = "dd/MM/yyyy HH:mm") =>
      format(date, formatStr),
  };
}

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [timezone, setTimezoneState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TIMEZONE_KEY) || defaultTimezone;
    }
    return defaultTimezone;
  });

  useEffect(() => {
    localStorage.setItem(TIMEZONE_KEY, timezone);
  }, [timezone]);

  const value = useMemo(() => {
    const { formatDate, formatDateTime } = createTimezoneFormatters(timezone);
    return {
      timezone,
      setTimezone: setTimezoneState,
      formatDate,
      formatDateTime,
    };
  }, [timezone]);

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error("useTimezone must be used within a TimezoneProvider");
  }
  return context;
}

// Helper hook for components that may not have the provider
// eslint-disable-next-line react-refresh/only-export-components
export function useDateFormatter() {
  const context = useContext(TimezoneContext);
  const timezone = context?.timezone || defaultTimezone;
  const { formatDate, formatDateTime } = createTimezoneFormatters(timezone);
  return { formatDate, formatDateTime, timezone };
}

// Common timezones for Brazil
// eslint-disable-next-line react-refresh/only-export-components
export const brazilianTimezones = [
  { value: "America/Sao_Paulo", label: "Brasília (BRT/BRST)" },
  { value: "America/Manaus", label: "Manaus (AMT)" },
  { value: "America/Cuiaba", label: "Cuiabá (AMT/AMST)" },
  { value: "America/Fortaleza", label: "Fortaleza (BRT)" },
  { value: "America/Belem", label: "Belém (BRT)" },
  { value: "America/Rio_Branco", label: "Rio Branco (ACT)" },
  { value: "America/Noronha", label: "Fernando de Noronha (FNT)" },
];

import {
  createContext,
  useContext,
  useState,
  useEffect,
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

const TimezoneContext = createContext<TimezoneContextType | undefined>(
  undefined,
);

const TIMEZONE_KEY = "logiflow_timezone";

const defaultTimezone =
  Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";

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

  const setTimezone = (tz: string) => {
    setTimezoneState(tz);
  };

  const formatDate = (date: Date | string, formatStr = "dd/MM/yyyy") => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return "-";
      return formatInTimeZone(dateObj, timezone, formatStr, { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const formatDateTime = (
    date: Date | string,
    formatStr = "dd/MM/yyyy HH:mm",
  ) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return "-";
      return formatInTimeZone(dateObj, timezone, formatStr, { locale: ptBR });
    } catch {
      return "-";
    }
  };

  return (
    <TimezoneContext.Provider
      value={{ timezone, setTimezone, formatDate, formatDateTime }}
    >
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error("useTimezone must be used within a TimezoneProvider");
  }
  return context;
}

// Helper hook for components that may not have the provider
export function useDateFormatter() {
  const context = useContext(TimezoneContext);

  const timezone = context?.timezone || defaultTimezone;

  const formatDate = (date: Date | string, formatStr = "dd/MM/yyyy") => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return "-";
      return formatInTimeZone(dateObj, timezone, formatStr, { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const formatDateTime = (
    date: Date | string,
    formatStr = "dd/MM/yyyy HH:mm",
  ) => {
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return "-";
      return formatInTimeZone(dateObj, timezone, formatStr, { locale: ptBR });
    } catch {
      return "-";
    }
  };

  return { formatDate, formatDateTime, timezone };
}

// Common timezones for Brazil
export const brazilianTimezones = [
  { value: "America/Sao_Paulo", label: "Brasília (BRT/BRST)" },
  { value: "America/Manaus", label: "Manaus (AMT)" },
  { value: "America/Cuiaba", label: "Cuiabá (AMT/AMST)" },
  { value: "America/Fortaleza", label: "Fortaleza (BRT)" },
  { value: "America/Belem", label: "Belém (BRT)" },
  { value: "America/Rio_Branco", label: "Rio Branco (ACT)" },
  { value: "America/Noronha", label: "Fernando de Noronha (FNT)" },
];

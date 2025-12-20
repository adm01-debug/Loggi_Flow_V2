import { useState, useEffect, useCallback } from "react";

/**
 * Hook para persistir estado no localStorage
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Get initial value from localStorage or use default
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when value changes
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Remove item from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Sync with other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue !== null) {
        try {
          setStoredValue(JSON.parse(event.newValue));
        } catch {
          setStoredValue(initialValue);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook para persistir estado no sessionStorage
 */
export function useSessionStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook para gerenciar histórico de buscas
 */
export function useSearchHistory(key: string, maxItems: number = 10) {
  const [history, setHistory] = useLocalStorage<string[]>(key, []);

  const addToHistory = useCallback((term: string) => {
    if (!term.trim()) return;
    
    setHistory((prev) => {
      const filtered = prev.filter((t) => t.toLowerCase() !== term.toLowerCase());
      return [term, ...filtered].slice(0, maxItems);
    });
  }, [setHistory, maxItems]);

  const removeFromHistory = useCallback((term: string) => {
    setHistory((prev) => prev.filter((t) => t !== term));
  }, [setHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  return { history, addToHistory, removeFromHistory, clearHistory };
}

/**
 * Hook para preferências do usuário
 */
interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: string;
  sidebarCollapsed: boolean;
  tablePageSize: number;
  notifications: {
    email: boolean;
    push: boolean;
    sla: boolean;
  };
}

const defaultPreferences: UserPreferences = {
  theme: "system",
  language: "pt-BR",
  sidebarCollapsed: false,
  tablePageSize: 10,
  notifications: {
    email: true,
    push: true,
    sla: true,
  },
};

export function useUserPreferences() {
  const [preferences, setPreferences, resetPreferences] = useLocalStorage<UserPreferences>(
    "user-preferences",
    defaultPreferences
  );

  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }, [setPreferences]);

  return {
    preferences,
    updatePreference,
    resetPreferences,
    setPreferences,
  };
}

/**
 * Hook para favoritos/itens salvos
 */
export function useFavorites<T extends { id: string }>(key: string) {
  const [favorites, setFavorites] = useLocalStorage<T[]>(key, []);

  const addFavorite = useCallback((item: T) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.id === item.id)) return prev;
      return [...prev, item];
    });
  }, [setFavorites]);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, [setFavorites]);

  const toggleFavorite = useCallback((item: T) => {
    const isFavorite = favorites.some((f) => f.id === item.id);
    if (isFavorite) {
      removeFavorite(item.id);
    } else {
      addFavorite(item);
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((id: string) => {
    return favorites.some((f) => f.id === id);
  }, [favorites]);

  return { favorites, addFavorite, removeFavorite, toggleFavorite, isFavorite };
}

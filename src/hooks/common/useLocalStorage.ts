import { useState, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    // Derive the next value from the latest state so functional updates never
    // read a stale closure, and persist the same value to keep storage in sync.
    setStoredValue((prev) => {
      const valueToStore = value instanceof Function ? (value as (val: T) => T)(prev) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch {
        // localStorage write error - silent fail
      }
      return valueToStore;
    });
  }, [key]);

  return [storedValue, setValue];
}

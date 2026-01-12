/**
 * Hook para Auto-Save de Formulários
 * 
 * @module hooks/useAutoSave
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface AutoSaveOptions<T> {
  /** Chave única para identificar o formulário no localStorage */
  key: string;
  /** Dados do formulário a serem salvos */
  data: T;
  /** Delay em ms antes de salvar (default: 1000) */
  debounceMs?: number;
  /** Função para validar se os dados devem ser salvos */
  shouldSave?: (data: T) => boolean;
  /** Callback quando os dados são restaurados */
  onRestore?: (data: T) => void;
  /** Callback quando os dados são salvos */
  onSave?: (data: T) => void;
  /** Se deve limpar ao submeter com sucesso */
  clearOnSubmit?: boolean;
}

interface AutoSaveReturn<T> {
  /** Indica se há dados salvos disponíveis */
  hasSavedData: boolean;
  /** Dados salvos no localStorage */
  savedData: T | null;
  /** Timestamp da última salvamento */
  lastSavedAt: Date | null;
  /** Status do auto-save */
  status: 'idle' | 'saving' | 'saved' | 'restored';
  /** Restaurar dados salvos */
  restore: () => void;
  /** Limpar dados salvos */
  clear: () => void;
  /** Forçar salvamento imediato */
  saveNow: () => void;
  /** Marcar formulário como submetido (limpa dados) */
  markAsSubmitted: () => void;
}

interface SavedFormData<T> {
  data: T;
  savedAt: string;
  version: number;
}

const CURRENT_VERSION = 1;

export function useAutoSave<T extends Record<string, unknown>>({
  key,
  data,
  debounceMs = 1000,
  shouldSave = () => true,
  onRestore,
  onSave,
  clearOnSubmit = true,
}: AutoSaveOptions<T>): AutoSaveReturn<T> {
  const storageKey = `autosave_${key}`;
  const [storedValue, setStoredValue] = useLocalStorage<SavedFormData<T> | null>(storageKey, null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'restored'>('idle');
  const [hasSavedData, setHasSavedData] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  // Verificar se há dados salvos na inicialização
  useEffect(() => {
    if (storedValue && storedValue.version === CURRENT_VERSION) {
      setHasSavedData(true);
    }
  }, [storedValue]);

  // Auto-save com debounce
  useEffect(() => {
    // Ignorar primeiro render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Verificar se deve salvar
    if (!shouldSave(data)) {
      return;
    }

    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setStatus('saving');

    // Configurar novo timeout para debounce
    timeoutRef.current = setTimeout(() => {
      const saveData: SavedFormData<T> = {
        data,
        savedAt: new Date().toISOString(),
        version: CURRENT_VERSION,
      };

      setStoredValue(saveData);
      setStatus('saved');
      setHasSavedData(true);
      onSave?.(data);

      // Resetar status após 2 segundos
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs, shouldSave, setStoredValue, onSave]);

  // Restaurar dados salvos
  const restore = useCallback(() => {
    if (storedValue && storedValue.version === CURRENT_VERSION) {
      onRestore?.(storedValue.data);
      setStatus('restored');
      
      // Resetar status após 2 segundos
      setTimeout(() => {
        setStatus('idle');
      }, 2000);
    }
  }, [storedValue, onRestore]);

  // Limpar dados salvos
  const clear = useCallback(() => {
    setStoredValue(null);
    setHasSavedData(false);
    setStatus('idle');
  }, [setStoredValue]);

  // Forçar salvamento imediato
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!shouldSave(data)) {
      return;
    }

    const saveData: SavedFormData<T> = {
      data,
      savedAt: new Date().toISOString(),
      version: CURRENT_VERSION,
    };

    setStoredValue(saveData);
    setStatus('saved');
    setHasSavedData(true);
    onSave?.(data);
  }, [data, shouldSave, setStoredValue, onSave]);

  // Marcar como submetido (limpa dados)
  const markAsSubmitted = useCallback(() => {
    if (clearOnSubmit) {
      clear();
    }
  }, [clearOnSubmit, clear]);

  // Dados derivados
  const savedData = storedValue?.data || null;
  const lastSavedAt = storedValue?.savedAt ? new Date(storedValue.savedAt) : null;

  return {
    hasSavedData,
    savedData,
    lastSavedAt,
    status,
    restore,
    clear,
    saveNow,
    markAsSubmitted,
  };
}

export default useAutoSave;

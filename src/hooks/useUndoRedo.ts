import { useState, useCallback, useRef } from 'react';

// ============================================
// UNDO/REDO HOOK
// Provides undo/redo functionality for any state
// ============================================

interface UndoRedoOptions {
  maxHistory?: number;
}

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useUndoRedo<T>(initialState: T, options: UndoRedoOptions = {}) {
  const { maxHistory = 50 } = options;
  
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const set = useCallback((newPresent: T | ((prev: T) => T)) => {
    setState((currentState) => {
      const resolvedPresent = typeof newPresent === 'function' 
        ? (newPresent as (prev: T) => T)(currentState.present) 
        : newPresent;
      
      // Don't update if the value is the same
      if (JSON.stringify(resolvedPresent) === JSON.stringify(currentState.present)) {
        return currentState;
      }

      const newPast = [...currentState.past, currentState.present].slice(-maxHistory);
      
      return {
        past: newPast,
        present: resolvedPresent,
        future: [],
      };
    });
  }, [maxHistory]);

  const undo = useCallback(() => {
    setState((currentState) => {
      if (currentState.past.length === 0) return currentState;

      const previous = currentState.past[currentState.past.length - 1];
      const newPast = currentState.past.slice(0, -1);

      return {
        past: newPast,
        present: previous,
        future: [currentState.present, ...currentState.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((currentState) => {
      if (currentState.future.length === 0) return currentState;

      const next = currentState.future[0];
      const newFuture = currentState.future.slice(1);

      return {
        past: [...currentState.past, currentState.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((newPresent?: T) => {
    setState({
      past: [],
      present: newPresent ?? initialState,
      future: [],
    });
  }, [initialState]);

  const clear = useCallback(() => {
    setState((currentState) => ({
      past: [],
      present: currentState.present,
      future: [],
    }));
  }, []);

  return {
    value: state.present,
    set,
    undo,
    redo,
    reset,
    clear,
    canUndo,
    canRedo,
    history: {
      past: state.past,
      future: state.future,
      length: state.past.length + state.future.length,
    },
  };
}

// ============================================
// UNDO MANAGER - For async operations
// ============================================

interface UndoAction {
  id: string;
  description: string;
  undo: () => Promise<void> | void;
  timestamp: number;
}

export function useUndoManager(options: { maxActions?: number; timeout?: number } = {}) {
  const { maxActions = 10, timeout = 10000 } = options;
  const actionsRef = useRef<UndoAction[]>([]);
  const [lastAction, setLastAction] = useState<UndoAction | null>(null);

  const registerUndo = useCallback((
    description: string,
    undoFn: () => Promise<void> | void
  ) => {
    const action: UndoAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description,
      undo: undoFn,
      timestamp: Date.now(),
    };

    actionsRef.current = [...actionsRef.current.slice(-(maxActions - 1)), action];
    setLastAction(action);

    // Auto-clear after timeout
    setTimeout(() => {
      actionsRef.current = actionsRef.current.filter(a => a.id !== action.id);
      if (lastAction?.id === action.id) {
        setLastAction(null);
      }
    }, timeout);

    return action.id;
  }, [maxActions, timeout, lastAction]);

  const undoLast = useCallback(async () => {
    const action = actionsRef.current.pop();
    if (!action) return false;

    try {
      await action.undo();
      setLastAction(actionsRef.current[actionsRef.current.length - 1] || null);
      return true;
    } catch (error) {
      console.error('Undo failed:', error);
      return false;
    }
  }, []);

  const undoById = useCallback(async (id: string) => {
    const actionIndex = actionsRef.current.findIndex(a => a.id === id);
    if (actionIndex === -1) return false;

    const action = actionsRef.current[actionIndex];
    try {
      await action.undo();
      actionsRef.current = actionsRef.current.filter(a => a.id !== id);
      setLastAction(actionsRef.current[actionsRef.current.length - 1] || null);
      return true;
    } catch (error) {
      console.error('Undo failed:', error);
      return false;
    }
  }, []);

  const clearAll = useCallback(() => {
    actionsRef.current = [];
    setLastAction(null);
  }, []);

  return {
    registerUndo,
    undoLast,
    undoById,
    clearAll,
    lastAction,
    hasUndoActions: actionsRef.current.length > 0,
    pendingActions: actionsRef.current.length,
  };
}

export default useUndoRedo;
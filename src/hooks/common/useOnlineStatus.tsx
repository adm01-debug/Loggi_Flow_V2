import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

/**
 * Hook para detectar status de conexão online/offline
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        toast.success("Conexão restaurada!", {
          description: "Você está online novamente.",
        });
      }
      setWasOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      toast.warning("Você está offline", {
        description: "Algumas funcionalidades podem não estar disponíveis.",
        duration: 5000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  return { isOnline, wasOffline };
}

/**
 * Hook para verificar status de conexão com API específica
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useApiStatus(healthCheckUrl?: string) {
  const [isApiOnline, setIsApiOnline] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkApi = useCallback(async () => {
    if (!healthCheckUrl) return;
    
    setIsChecking(true);
    try {
      const response = await fetch(healthCheckUrl, {
        method: "HEAD",
        cache: "no-cache",
      });
      setIsApiOnline(response.ok);
    } catch {
      setIsApiOnline(false);
    } finally {
      setLastCheck(new Date());
      setIsChecking(false);
    }
  }, [healthCheckUrl]);

  useEffect(() => {
    if (healthCheckUrl) {
      checkApi();
      const interval = setInterval(checkApi, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [healthCheckUrl, checkApi]);

  return { isApiOnline, lastCheck, isChecking, checkApi };
}

/**
 * Hook para sincronização offline
 * Armazena operações pendentes quando offline
 */
interface PendingOperation {
  id: string;
  type: "create" | "update" | "delete";
  entity: string;
  data: unknown;
  timestamp: number;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useOfflineSync() {
  const { isOnline } = useOnlineStatus();
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load pending operations from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("pendingOperations");
    if (stored) {
      try {
        setPendingOperations(JSON.parse(stored));
      } catch {
        localStorage.removeItem("pendingOperations");
      }
    }
  }, []);

  // Save pending operations to localStorage
  useEffect(() => {
    localStorage.setItem("pendingOperations", JSON.stringify(pendingOperations));
  }, [pendingOperations]);

  // Add operation to queue
  const queueOperation = useCallback((
    type: PendingOperation["type"],
    entity: string,
    data: unknown
  ) => {
    const operation: PendingOperation = {
      id: crypto.randomUUID(),
      type,
      entity,
      data,
      timestamp: Date.now(),
    };
    setPendingOperations((prev) => [...prev, operation]);
    return operation.id;
  }, []);

  // Remove operation from queue
  const removeOperation = useCallback((id: string) => {
    setPendingOperations((prev) => prev.filter((op) => op.id !== id));
  }, []);

  // Clear all pending operations
  const clearOperations = useCallback(() => {
    setPendingOperations([]);
    localStorage.removeItem("pendingOperations");
  }, []);

  // Sync when back online
  const syncOperations = useCallback(async (
    syncFn: (operation: PendingOperation) => Promise<boolean>
  ) => {
    if (!isOnline || pendingOperations.length === 0) return;

    setIsSyncing(true);
    const results: { id: string; success: boolean }[] = [];

    for (const operation of pendingOperations) {
      try {
        const success = await syncFn(operation);
        results.push({ id: operation.id, success });
        if (success) {
          removeOperation(operation.id);
        }
      } catch {
        results.push({ id: operation.id, success: false });
      }
    }

    setIsSyncing(false);

    const successCount = results.filter((r) => r.success).length;
    if (successCount > 0) {
      toast.success(`${successCount} operações sincronizadas`);
    }

    const failCount = results.filter((r) => !r.success).length;
    if (failCount > 0) {
      toast.error(`${failCount} operações falharam na sincronização`);
    }

    return results;
  }, [isOnline, pendingOperations, removeOperation]);

  return {
    isOnline,
    pendingOperations,
    pendingCount: pendingOperations.length,
    isSyncing,
    queueOperation,
    removeOperation,
    clearOperations,
    syncOperations,
  };
}

/**
 * Componente indicador de status online/offline
 */
export function OnlineStatusIndicator() {
  const { isOnline } = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-warning text-warning-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
      <div className="w-2 h-2 rounded-full bg-current" />
      <span className="text-sm font-medium">Modo Offline</span>
    </div>
  );
}

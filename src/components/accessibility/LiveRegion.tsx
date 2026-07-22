import { useState, useCallback, createContext, useContext, ReactNode } from "react";

type Politeness = "polite" | "assertive" | "off";

interface LiveRegionContextValue {
  announce: (message: string, politeness?: Politeness) => void;
}

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null);

export function LiveRegionProvider({ children }: { children: ReactNode }) {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");

  const announce = useCallback((message: string, politeness: Politeness = "polite") => {
    if (politeness === "assertive") {
      setAssertiveMessage("");
      setTimeout(() => setAssertiveMessage(message), 50);
    } else if (politeness === "polite") {
      setPoliteMessage("");
      setTimeout(() => setPoliteMessage(message), 50);
    }
  }, []);

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      
      {/* Polite announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>

      {/* Assertive announcements */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </LiveRegionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLiveRegion() {
  const context = useContext(LiveRegionContext);
  if (!context) {
    throw new Error("useLiveRegion must be used within LiveRegionProvider");
  }
  return context;
}

// Hook for announcing route changes
// eslint-disable-next-line react-refresh/only-export-components
export function useRouteAnnouncer() {
  const { announce } = useLiveRegion();

  const announceRouteChange = useCallback((pageName: string) => {
    announce(`Navegou para ${pageName}`, "polite");
  }, [announce]);

  return { announceRouteChange };
}

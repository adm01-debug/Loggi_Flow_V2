import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useConfirmExit(isDirty: boolean, message: string = "Você tem alterações não salvas. Deseja realmente sair?") {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, message]);

  // Handle in-app navigation changes is harder with react-router v6.4+ without unstable_useBlocker
  // but we can at least handle the browser back button and window close.
}

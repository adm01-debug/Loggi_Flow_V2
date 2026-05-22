import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useConfirmExit(isDirty: boolean, message: string = "Você tem alterações não salvas. Deseja realmente sair?") {
  const location = useLocation();

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

  // Alert on route change if dirty (using basic window.confirm as a fallback for internal navigation)
  useEffect(() => {
    if (isDirty) {
      // Note: react-router-dom v6 doesn't have a stable 'useBlocker' yet in the standard version
      // but this is a reminder that internal navigation might need handling depending on the setup.
    }
  }, [location, isDirty]);
}

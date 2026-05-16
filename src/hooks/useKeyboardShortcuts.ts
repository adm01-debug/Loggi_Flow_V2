import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export function useKeyboardShortcuts() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + Left Arrow -> Back
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        if (window.history.length > 2) {
          navigate(-1);
        } else {
          navigate("/");
        }
      }

      // Alt + Right Arrow -> Forward
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        navigate(1);
      }

      // Alt + H -> Home
      if (e.altKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        navigate("/");
        toast({
          title: "Navegação rápida",
          description: "Voltando para a página inicial",
          duration: 2000,
        });
      }

      // Alt + N -> Novo Despacho (common action)
      if (e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        navigate("/despachos");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, toast]);
}

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SensitiveAction = "change_password" | "change_email" | "configure_mfa" | "admin_action" | "delete_account";

interface ReauthResult {
  verified: boolean;
  reauth_token?: string;
  expires_at?: string;
  error?: string;
}

export function useReauth() {
  const [isLoading, setIsLoading] = useState(false);
  const [showReauthDialog, setShowReauthDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    action: SensitiveAction;
    onSuccess: () => void;
  } | null>(null);

  const requireReauth = useCallback((action: SensitiveAction, onSuccess: () => void) => {
    setPendingAction({ action, onSuccess });
    setShowReauthDialog(true);
  }, []);

  const verifyPassword = useCallback(async (password: string): Promise<boolean> => {
    if (!pendingAction) return false;
    
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        return false;
      }

      const response = await supabase.functions.invoke("verify-reauth", {
        body: {
          action: pendingAction.action,
          current_password: password,
        },
      });

      if (response.error) {
        toast.error(response.error.message || "Erro na verificação");
        return false;
      }

      const result = response.data as ReauthResult;

      if (result.verified) {
        setShowReauthDialog(false);
        pendingAction.onSuccess();
        setPendingAction(null);
        return true;
      } else {
        toast.error(result.error || "Senha incorreta");
        return false;
      }
    } catch (error) {
      console.error("Reauth error:", error);
      toast.error("Erro ao verificar credenciais");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [pendingAction]);

  const cancelReauth = useCallback(() => {
    setShowReauthDialog(false);
    setPendingAction(null);
  }, []);

  return {
    isLoading,
    showReauthDialog,
    pendingAction,
    requireReauth,
    verifyPassword,
    cancelReauth,
  };
}

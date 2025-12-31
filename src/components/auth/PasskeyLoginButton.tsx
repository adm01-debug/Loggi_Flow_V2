import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Fingerprint, Loader2 } from "lucide-react";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PasskeyLoginButtonProps {
  email?: string;
  onSuccess?: () => void;
  className?: string;
}

export function PasskeyLoginButton({ email, onSuccess, className }: PasskeyLoginButtonProps) {
  const { authenticateWithPasskey, checkSupport } = useWebAuthn();
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState<boolean | null>(null);

  // Check support on mount
  useState(() => {
    checkSupport().then(setIsSupported);
  });

  const handlePasskeyLogin = async () => {
    setIsLoading(true);

    try {
      const result = await authenticateWithPasskey(email);

      if (result) {
        // Get user's email from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", result.userId)
          .single();

        if (profile?.email) {
          // For now, we can't directly sign in with passkey without password
          // This is a limitation - we'd need a custom auth flow
          // Instead, we show success and let the user know they authenticated
          toast.success("Identidade verificada com sucesso!", {
            description: "Use suas credenciais para completar o login",
          });
          onSuccess?.();
        }
      }
    } catch (error) {
      console.error("[PasskeyLogin] Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSupported === false) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handlePasskeyLogin}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Fingerprint className="h-4 w-4 mr-2" />
      )}
      Entrar com Biometria
    </Button>
  );
}

import { useState } from "react";
import { useReauth } from "@/hooks/useReauth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, Eye, EyeOff } from "lucide-react";

interface ReauthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (password: string) => Promise<boolean>;
  isLoading: boolean;
  actionDescription?: string;
}

export function ReauthDialog({
  open,
  onOpenChange,
  onVerify,
  isLoading,
  actionDescription = "esta ação",
}: ReauthDialogProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("Digite sua senha");
      return;
    }

    const success = await onVerify(password);
    if (!success) {
      setError("Senha incorreta. Tente novamente.");
    } else {
      setPassword("");
    }
  };

  const handleClose = () => {
    setPassword("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-amber-500" />
          </div>
          <DialogTitle className="text-center">Confirme sua Identidade</DialogTitle>
          <DialogDescription className="text-center">
            Por segurança, digite sua senha para continuar com {actionDescription}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reauth-password">Senha Atual</Label>
            <div className="relative">
              <Input
                id="reauth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Digite sua senha"
                disabled={isLoading}
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !password}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Wrapper component that uses the useReauth hook
export function ReauthProvider({ children }: { children: React.ReactNode }) {
  const { showReauthDialog, verifyPassword, cancelReauth, isLoading, pendingAction } = useReauth();

  const getActionDescription = () => {
    if (!pendingAction) return "esta ação";
    
    const descriptions: Record<string, string> = {
      change_password: "a alteração de senha",
      change_email: "a alteração de email",
      configure_mfa: "a configuração do 2FA",
      admin_action: "esta ação administrativa",
      delete_account: "a exclusão da conta",
    };
    
    return descriptions[pendingAction.action] || "esta ação";
  };

  return (
    <>
      {children}
      <ReauthDialog
        open={showReauthDialog}
        onOpenChange={(open) => !open && cancelReauth()}
        onVerify={verifyPassword}
        isLoading={isLoading}
        actionDescription={getActionDescription()}
      />
    </>
  );
}

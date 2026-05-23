import { useSessionTimeout } from "@/hooks/auth/useSessionTimeout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock, RefreshCw, LogOut } from "lucide-react";

export function SessionTimeoutWarning() {
  const { sessionInfo, showWarning, setShowWarning, refreshSession, signOut } = useSessionTimeout();

  if (!showWarning) return null;

  return (
    <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-warning" />
          </div>
          <AlertDialogTitle className="text-center">
            Sessão Expirando
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Sua sessão expira em{" "}
            <span className="font-semibold text-warning">
              {sessionInfo.remainingMinutes} minuto{sessionInfo.remainingMinutes !== 1 ? "s" : ""}
            </span>
            . Deseja continuar conectado?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel
            onClick={() => {
              setShowWarning(false);
              signOut();
            }}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              await refreshSession();
              setShowWarning(false);
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Continuar Conectado
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePushNotifications } from "@/hooks/notifications/usePushNotifications";

export function PushNotificationCard() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  if (!isSupported) return null;

  const handleToggle = () => {
    if (isSubscribed) {
      void unsubscribe();
    } else {
      void subscribe();
    }
  };

  let statusLabel = "Desativadas";
  if (isSubscribed) statusLabel = "Ativas";
  else if (permission === "denied") statusLabel = "Bloqueadas pelo navegador";

  const disabled = isLoading || permission === "denied";

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
      <div className="flex items-center gap-2 text-sm">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            isSubscribed ? "bg-emerald-500" : "bg-muted-foreground/40",
          )}
        />
        <span className="text-muted-foreground">
          Notificações do navegador:{" "}
          <span className="font-medium text-foreground">{statusLabel}</span>
        </span>
      </div>
      <Button
        variant={isSubscribed ? "outline" : "default"}
        size="sm"
        onClick={handleToggle}
        disabled={disabled}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Bell className="w-4 h-4 mr-2" />
        )}
        {isSubscribed ? "Desativar" : "Ativar notificações"}
      </Button>
    </div>
  );
}

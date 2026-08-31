/* eslint-disable sonarjs/constructor-for-side-effects */
import { useState, useEffect } from "react";
import { Bell, BellOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications } from "@/hooks/notifications/useNotifications";

export function BrowserNotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [dismissed, setDismissed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const { requestPermission } = useNotifications();

  useEffect(() => {
    // Check if notifications are supported
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }

    setPermission(window.Notification.permission);

    // Check if user has previously dismissed the prompt
    const wasDismissed = localStorage.getItem("notification-prompt-dismissed");
    if (wasDismissed) {
      setDismissed(true);
    }

    // Show prompt after a short delay if permission not granted and not dismissed
    const timer = setTimeout(() => {
      if (window.Notification.permission === "default" && !wasDismissed) {
        setShowPrompt(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      setPermission("granted");
      setShowPrompt(false);
      
      // Show a test notification
      new window.Notification("Notificações Ativadas! 🔔", {
        body: "Você receberá alertas importantes mesmo quando a aba não estiver em foco.",
        icon: "/favicon.ico",
      });
    } else {
      setPermission("denied");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("notification-prompt-dismissed", "true");
  };

  if (permission === "unsupported" || permission === "granted" || dismissed || !showPrompt) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <Card className="border-primary/20 bg-card/95 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-sm">Ativar Notificações</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mt-1 -mr-1"
                    onClick={handleDismiss}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground mt-1">
                  Receba alertas de entregas, coletas e conquistas mesmo quando não estiver nesta aba.
                </p>

                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={handleEnable} className="flex-1">
                    <Bell className="w-4 h-4 mr-1" />
                    Ativar
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDismiss}>
                    Agora não
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

// Status indicator component for header/settings
export function NotificationPermissionStatus() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const { requestPermission } = useNotifications();

  useEffect(() => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(window.Notification.permission);
  }, []);

  const handleToggle = async () => {
    if (permission === "granted") {
      // Can't programmatically revoke, inform user
      alert("Para desativar notificações, use as configurações do navegador.");
      return;
    }
    
    const granted = await requestPermission();
    if (granted) {
      setPermission("granted");
    }
  };

  if (permission === "unsupported") {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="w-4 h-4" />
        <span>Navegador não suporta notificações</span>
      </div>
    );
  }

  return (
    <Button
      variant={permission === "granted" ? "outline" : "default"}
      size="sm"
      onClick={handleToggle}
      className="gap-2"
    >
      {permission === "granted" ? (
        <>
          <Bell className="w-4 h-4 text-success" />
          <span>Notificações Ativas</span>
        </>
      ) : (
        <>
          <BellOff className="w-4 h-4" />
          <span>Ativar Notificações</span>
        </>
      )}
    </Button>
  );
}

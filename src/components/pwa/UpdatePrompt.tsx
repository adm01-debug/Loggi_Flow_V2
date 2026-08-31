/* eslint-disable sonarjs/no-nested-functions */
import { useState, useEffect } from "react";
import { RefreshCw, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

export function UpdatePrompt() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let updateInterval: ReturnType<typeof setInterval> | null = null;

    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setShowUpdate(true);
          }
        });
      });

      // Check for updates periodically
      updateInterval = setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Every hour
    });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      if (updateInterval) clearInterval(updateInterval);
    };
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
  };

  if (!showUpdate) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md z-50"
      >
        <Card className="border-primary/30 bg-card/95 backdrop-blur-sm shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">Nova versão disponível!</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Atualize para obter as últimas melhorias.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" onClick={handleUpdate} className="gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Atualizar
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleDismiss}
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

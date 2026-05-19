import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, Volume2, VolumeX, AlertTriangle, CheckCircle2, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSLANotifications } from "@/hooks";

export function SLANotificationSettings() {
  const [open, setOpen] = useState(false);
  const { permission, config, setConfig, requestPermission, isSupported } = useSLANotifications();

  if (!isSupported) {
    return null;
  }

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative",
            config.enabled && permission === "granted" && "text-success"
          )}
        >
          {config.enabled && permission === "granted" ? (
            <Bell className="w-5 h-5" />
          ) : (
            <BellOff className="w-5 h-5 text-muted-foreground" />
          )}
          {config.enabled && permission === "granted" && config.criticalAlerts && (
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute top-1 right-1 w-2 h-2 rounded-full bg-success"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-semibold">Notificações SLA</h4>
            </div>
            {permission === "granted" ? (
              <Badge variant="secondary" className="text-xs bg-success/10 text-success">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Ativo
              </Badge>
            ) : permission === "denied" ? (
              <Badge variant="destructive" className="text-xs">
                Bloqueado
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">
                Pendente
              </Badge>
            )}
          </div>

          {permission !== "granted" && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
              <p className="text-sm text-muted-foreground mb-2">
                Habilite as notificações para receber alertas de SLA em tempo real.
              </p>
              <Button size="sm" onClick={handleRequestPermission} className="w-full">
                <Bell className="w-4 h-4 mr-2" />
                Habilitar Notificações
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications-enabled" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notificações ativas
              </Label>
              <Switch
                id="notifications-enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
              />
            </div>

            <AnimatePresence>
              {config.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 pt-2 border-t border-border"
                >
                  <div className="flex items-center justify-between">
                    <Label htmlFor="critical-alerts" className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      Alertas críticos
                    </Label>
                    <Switch
                      id="critical-alerts"
                      checked={config.criticalAlerts}
                      onCheckedChange={(checked) => setConfig({ ...config, criticalAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="warning-alerts" className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      Alertas de aviso
                    </Label>
                    <Switch
                      id="warning-alerts"
                      checked={config.warningAlerts}
                      onCheckedChange={(checked) => setConfig({ ...config, warningAlerts: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="sound-enabled" className="flex items-center gap-2">
                      {config.soundEnabled ? (
                        <Volume2 className="w-4 h-4 text-info" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-muted-foreground" />
                      )}
                      Som de alerta
                    </Label>
                    <Switch
                      id="sound-enabled"
                      checked={config.soundEnabled}
                      onCheckedChange={(checked) => setConfig({ ...config, soundEnabled: checked })}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-xs text-muted-foreground">
            Você receberá notificações quando entregas ou coletas estiverem atrasadas ou próximas do prazo.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

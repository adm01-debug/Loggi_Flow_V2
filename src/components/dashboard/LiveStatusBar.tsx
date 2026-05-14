import { Activity, Database, Shield, Wifi, Clock } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function LiveStatusBar() {
  const { isOnline } = useOnlineStatus();
  const { data: metrics, isFetching } = useDashboardMetrics();

  const statusItems = [
    {
      icon: Wifi,
      label: isOnline ? "Online" : "Offline",
      status: isOnline ? "success" : "danger",
    },
    {
      icon: Database,
      label: isFetching ? "Sincronizando..." : "Sincronizado",
      status: isFetching ? "warning" : "success",
    },
    {
      icon: Shield,
      label: "Seguro",
      status: "success" as const,
    },
    {
      icon: Activity,
      label: `${metrics?.alertasCriticos || 0} alertas`,
      status: (metrics?.alertasCriticos || 0) > 0 ? "warning" : "success",
    },
    {
      icon: Clock,
      label: metrics?.lastSync ? `Sinc: ${format(new Date(metrics.lastSync), 'HH:mm:ss')}` : 'Aguardando...',
      status: metrics?.lastSync ? "success" : "warning",
    },
  ];

  const statusColors = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
  };

  const dotColors = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
  };

  return (
    <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto scrollbar-none py-1">
      {statusItems.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-1.5 text-xs font-medium shrink-0"
        >
          <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", dotColors[item.status as keyof typeof dotColors])} />
          <item.icon className={cn("w-3 h-3", statusColors[item.status as keyof typeof statusColors])} />
          <span className="text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

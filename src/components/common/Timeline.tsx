import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LucideIcon, Circle, CheckCircle2, AlertCircle, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string | Date;
  icon?: LucideIcon;
  iconColor?: string;
  status?: "completed" | "current" | "pending" | "error";
  user?: string;
  metadata?: Record<string, any>;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

const statusIcons = {
  completed: CheckCircle2,
  current: Clock,
  pending: Circle,
  error: AlertCircle,
};

const statusColors = {
  completed: "text-green-500 bg-green-500/10",
  current: "text-blue-500 bg-blue-500/10",
  pending: "text-muted-foreground bg-muted",
  error: "text-red-500 bg-red-500/10",
};

export function Timeline({ events, className }: TimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum evento registrado
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Linha vertical */}
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />

      <div className="space-y-4">
        {events.map((event, index) => {
          const Icon = event.icon || statusIcons[event.status || "pending"];
          const colorClass = event.iconColor || statusColors[event.status || "pending"];

          return (
            <div key={event.id} className="relative flex gap-4 pl-10">
              {/* Ícone */}
              <div
                className={cn(
                  "absolute left-0 flex h-8 w-8 items-center justify-center rounded-full",
                  colorClass
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {event.description}
                      </p>
                    )}
                  </div>
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(event.timestamp), "dd/MM HH:mm", {
                      locale: ptBR,
                    })}
                  </time>
                </div>

                {event.user && (
                  <p className="text-xs text-muted-foreground mt-1">
                    por {event.user}
                  </p>
                )}

                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className="mt-2 text-xs space-y-0.5">
                    {Object.entries(event.metadata).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-1 text-muted-foreground">
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-medium">{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Timeline horizontal para status de entrega
interface StatusTimelineProps {
  steps: {
    id: string;
    label: string;
    status: "completed" | "current" | "pending";
    timestamp?: string | Date;
  }[];
  className?: string;
}

export function StatusTimeline({ steps, className }: StatusTimelineProps) {
  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium",
                step.status === "completed" && "bg-green-500 text-white",
                step.status === "current" && "bg-blue-500 text-white",
                step.status === "pending" && "bg-muted text-muted-foreground"
              )}
            >
              {step.status === "completed" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                index + 1
              )}
            </div>
            <span className="text-xs mt-1 text-center max-w-[80px]">
              {step.label}
            </span>
            {step.timestamp && (
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(step.timestamp), "HH:mm")}
              </span>
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "flex-1 h-0.5 mx-2",
                step.status === "completed" ? "bg-green-500" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default Timeline;

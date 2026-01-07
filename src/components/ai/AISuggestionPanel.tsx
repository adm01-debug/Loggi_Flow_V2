import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  X, 
  ChevronRight,
  CheckCircle2,
  Clock,
  Zap,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface AISuggestion {
  id: string;
  type: "optimization" | "warning" | "insight" | "action";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  impact?: string;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
  metadata?: Record<string, any>;
}

interface AISuggestionPanelProps {
  suggestions: AISuggestion[];
  onDismiss?: (id: string) => void;
  onAction?: (suggestion: AISuggestion) => void;
  isLoading?: boolean;
  title?: string;
  compact?: boolean;
  className?: string;
}

const typeConfig = {
  optimization: {
    icon: TrendingUp,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
  },
  insight: {
    icon: Lightbulb,
    color: "text-info",
    bgColor: "bg-info/10",
    borderColor: "border-info/30",
  },
  action: {
    icon: Zap,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  },
};

const priorityColors = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  low: "bg-muted text-muted-foreground",
};

function SuggestionCard({
  suggestion,
  onDismiss,
  onAction,
  compact,
}: {
  suggestion: AISuggestion;
  onDismiss?: (id: string) => void;
  onAction?: (suggestion: AISuggestion) => void;
  compact?: boolean;
}) {
  const config = typeConfig[suggestion.type];
  const Icon = config.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "relative group",
        compact ? "p-3" : "p-4",
        "rounded-xl border transition-all duration-200",
        config.bgColor,
        config.borderColor,
        "hover:shadow-lg hover:scale-[1.02]"
      )}
    >
      {suggestion.dismissible !== false && onDismiss && (
        <button
          onClick={() => onDismiss(suggestion.id)}
          className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/50"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      <div className="flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", config.bgColor)}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn("font-medium", compact ? "text-sm" : "text-base")}>
              {suggestion.title}
            </h4>
            <Badge variant="outline" className={cn("text-xs", priorityColors[suggestion.priority])}>
              {suggestion.priority === "high" ? "Alta" : suggestion.priority === "medium" ? "Média" : "Baixa"}
            </Badge>
          </div>

          <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
            {suggestion.description}
          </p>

          {suggestion.impact && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              <Target className="w-3 h-3 text-success" />
              <span className="text-success font-medium">{suggestion.impact}</span>
            </div>
          )}

          {suggestion.actionLabel && (
            <Button
              variant="ghost"
              size="sm"
              className={cn("mt-2 gap-1 h-7", config.color)}
              onClick={() => {
                suggestion.onAction?.();
                onAction?.(suggestion);
              }}
            >
              {suggestion.actionLabel}
              <ChevronRight className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="p-4 rounded-xl border border-dashed border-muted-foreground/30 animate-pulse"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 bg-muted rounded" />
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-1/2 bg-muted rounded" />
            </div>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-center gap-2 py-2 text-xs text-muted-foreground">
        <Sparkles className="w-3 h-3 animate-pulse" />
        Analisando dados...
      </div>
    </div>
  );
}

export function AISuggestionPanel({
  suggestions,
  onDismiss,
  onAction,
  isLoading,
  title = "Sugestões da IA",
  compact = false,
  className,
}: AISuggestionPanelProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleDismiss = useCallback((id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
    onDismiss?.(id);
  }, [onDismiss]);

  const visibleSuggestions = suggestions.filter((s) => !dismissed.has(s.id));
  const highPriority = visibleSuggestions.filter((s) => s.priority === "high");
  const otherSuggestions = visibleSuggestions.filter((s) => s.priority !== "high");

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingState />
        </CardContent>
      </Card>
    );
  }

  if (visibleSuggestions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-success/10 mb-3">
              <CheckCircle2 className="w-6 h-6 text-success" />
            </div>
            <p className="text-sm font-medium">Tudo em ordem!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Nenhuma sugestão no momento
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="w-4 h-4 text-primary" />
            {title}
            <Badge variant="secondary" className="ml-1">
              {visibleSuggestions.length}
            </Badge>
          </CardTitle>
          {highPriority.length > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {highPriority.length} urgente{highPriority.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <AnimatePresence mode="popLayout">
          {visibleSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onDismiss={handleDismiss}
              onAction={onAction}
              compact={compact}
            />
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// Hook para gerar sugestões baseadas em dados
export function useAISuggestions(data: {
  pendingDeliveries?: number;
  delayedDeliveries?: number;
  lowPerformanceCarriers?: string[];
  costTrend?: "up" | "down" | "stable";
}): AISuggestion[] {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);

  useEffect(() => {
    const newSuggestions: AISuggestion[] = [];

    if (data.delayedDeliveries && data.delayedDeliveries > 0) {
      newSuggestions.push({
        id: "delayed-deliveries",
        type: "warning",
        priority: data.delayedDeliveries > 5 ? "high" : "medium",
        title: `${data.delayedDeliveries} entregas atrasadas`,
        description: "Verifique as entregas com atraso para evitar impacto no SLA.",
        impact: "Melhoria de até 15% no índice de satisfação",
        actionLabel: "Ver entregas",
      });
    }

    if (data.lowPerformanceCarriers && data.lowPerformanceCarriers.length > 0) {
      newSuggestions.push({
        id: "low-performance-carriers",
        type: "optimization",
        priority: "medium",
        title: "Transportadoras com baixa performance",
        description: `${data.lowPerformanceCarriers.join(", ")} estão abaixo da média. Considere renegociar ou buscar alternativas.`,
        impact: "Redução de até 20% em atrasos",
        actionLabel: "Analisar",
      });
    }

    if (data.costTrend === "up") {
      newSuggestions.push({
        id: "cost-increase",
        type: "insight",
        priority: "low",
        title: "Custos em alta",
        description: "Os custos de frete aumentaram nos últimos 7 dias. Revise cotações.",
        impact: "Potencial economia de 8% no frete",
        actionLabel: "Ver análise",
      });
    }

    if (data.pendingDeliveries && data.pendingDeliveries > 20) {
      newSuggestions.push({
        id: "high-pending",
        type: "action",
        priority: "medium",
        title: "Alto volume pendente",
        description: `${data.pendingDeliveries} entregas aguardando despacho. Priorize o processamento.`,
        actionLabel: "Processar agora",
      });
    }

    setSuggestions(newSuggestions);
  }, [data]);

  return suggestions;
}

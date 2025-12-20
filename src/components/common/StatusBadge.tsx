import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Clock, Truck, CheckCircle2, XCircle, AlertTriangle, Package, Send, Loader2 } from "lucide-react";
import { LucideIcon } from "lucide-react";

type StatusType = 
  | "pending" | "in_progress" | "completed" | "cancelled" | "error" | "warning"
  | "aguardando_producao" | "pronto_despacho" | "despachado" | "em_transito" | "saiu_entrega" 
  | "entregue" | "finalizado" | "finalizada" | "ocorrencia" | "divergencia" | "atrasado"
  | "solicitada" | "agendada" | "coletada" | "cancelada"
  | "pendente" | "ativo" | "inativo";

interface StatusConfig {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
  icon?: LucideIcon;
}

const statusConfigs: Record<StatusType, StatusConfig> = {
  // Generic
  pending: { label: "Pendente", variant: "secondary", className: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  in_progress: { label: "Em Andamento", variant: "secondary", className: "bg-info/10 text-info border-info/20", icon: Loader2 },
  completed: { label: "Concluído", variant: "secondary", className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", variant: "secondary", className: "bg-muted text-muted-foreground", icon: XCircle },
  error: { label: "Erro", variant: "destructive", className: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  warning: { label: "Atenção", variant: "secondary", className: "bg-warning/10 text-warning border-warning/20", icon: AlertTriangle },
  
  // Entregas
  aguardando_producao: { label: "Aguardando Produção", variant: "outline", className: "bg-muted/50 text-muted-foreground", icon: Clock },
  pronto_despacho: { label: "Pronto p/ Despacho", variant: "secondary", className: "bg-info/10 text-info border-info/20", icon: Package },
  despachado: { label: "Despachado", variant: "secondary", className: "bg-primary/10 text-primary border-primary/20", icon: Send },
  em_transito: { label: "Em Trânsito", variant: "secondary", className: "bg-info/10 text-info border-info/20", icon: Truck },
  saiu_entrega: { label: "Saiu p/ Entrega", variant: "secondary", className: "bg-primary/10 text-primary border-primary/20", icon: Truck },
  entregue: { label: "Entregue", variant: "secondary", className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  finalizado: { label: "Finalizado", variant: "secondary", className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  finalizada: { label: "Finalizada", variant: "secondary", className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  ocorrencia: { label: "Ocorrência", variant: "destructive", className: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle },
  divergencia: { label: "Divergência", variant: "secondary", className: "bg-warning/10 text-warning border-warning/20", icon: AlertTriangle },
  atrasado: { label: "Atrasado", variant: "destructive", className: "bg-destructive/10 text-destructive border-destructive/20", icon: Clock },
  
  // Coletas
  solicitada: { label: "Solicitada", variant: "outline", className: "bg-muted/50 text-muted-foreground", icon: Clock },
  agendada: { label: "Agendada", variant: "secondary", className: "bg-info/10 text-info border-info/20", icon: Clock },
  coletada: { label: "Coletada", variant: "secondary", className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  cancelada: { label: "Cancelada", variant: "secondary", className: "bg-muted text-muted-foreground", icon: XCircle },
  
  // General
  pendente: { label: "Pendente", variant: "secondary", className: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  ativo: { label: "Ativo", variant: "secondary", className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  inativo: { label: "Inativo", variant: "secondary", className: "bg-muted text-muted-foreground", icon: XCircle },
};

interface StatusBadgeProps {
  status: string;
  showIcon?: boolean;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function StatusBadge({ status, showIcon = true, size = "default", className }: StatusBadgeProps) {
  const config = statusConfigs[status as StatusType] || {
    label: status,
    variant: "outline" as const,
    className: "bg-muted/50",
    icon: undefined,
  };

  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0",
    default: "text-xs px-2 py-0.5",
    lg: "text-sm px-2.5 py-1",
  };

  return (
    <Badge 
      variant={config.variant} 
      className={cn(
        "font-medium border",
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && Icon && <Icon className={cn("mr-1", size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />}
      {config.label}
    </Badge>
  );
}

// Helper to get just the label
export function getStatusLabel(status: string): string {
  return statusConfigs[status as StatusType]?.label || status;
}

// Helper to get status color class
export function getStatusColor(status: string): string {
  return statusConfigs[status as StatusType]?.className || "bg-muted";
}

// Status options for selects
export const statusOptions = {
  entregas: [
    { value: "aguardando_producao", label: "Aguardando Produção" },
    { value: "pronto_despacho", label: "Pronto p/ Despacho" },
    { value: "despachado", label: "Despachado" },
    { value: "em_transito", label: "Em Trânsito" },
    { value: "saiu_entrega", label: "Saiu p/ Entrega" },
    { value: "entregue", label: "Entregue" },
    { value: "ocorrencia", label: "Ocorrência" },
  ],
  coletas: [
    { value: "solicitada", label: "Solicitada" },
    { value: "agendada", label: "Agendada" },
    { value: "em_transito", label: "Em Trânsito" },
    { value: "coletada", label: "Coletada" },
    { value: "finalizada", label: "Finalizada" },
    { value: "cancelada", label: "Cancelada" },
  ],
  fretesInternos: [
    { value: "pendente", label: "Pendente" },
    { value: "em_transito", label: "Em Trânsito" },
    { value: "entregue", label: "Entregue" },
    { value: "atrasado", label: "Atrasado" },
    { value: "cancelado", label: "Cancelado" },
  ],
};

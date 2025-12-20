import { LucideIcon, Package, Search, FileX, Users, Truck, AlertTriangle, Bell, Trophy, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon = Package, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Predefined empty states for common scenarios
export function EmptySearchResult({ query, onClear }: { query?: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon={Search}
      title="Nenhum resultado encontrado"
      description={query ? `Não encontramos resultados para "${query}". Tente termos diferentes.` : "Tente ajustar os filtros de busca."}
      action={onClear ? { label: "Limpar busca", onClick: onClear } : undefined}
    />
  );
}

export function EmptyList({ entityName, onCreate }: { entityName: string; onCreate?: () => void }) {
  return (
    <EmptyState
      icon={FileX}
      title={`Nenhum ${entityName} encontrado`}
      description={`Você ainda não possui ${entityName.toLowerCase()}s cadastrados.`}
      action={onCreate ? { label: `Adicionar ${entityName}`, onClick: onCreate } : undefined}
    />
  );
}

export function EmptyClientes({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="Nenhum cliente cadastrado"
      description="Cadastre seus clientes para gerenciar entregas de forma eficiente."
      action={onCreate ? { label: "Cadastrar Cliente", onClick: onCreate } : undefined}
    />
  );
}

export function EmptyFornecedores({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={Package}
      title="Nenhum fornecedor cadastrado"
      description="Cadastre seus fornecedores para organizar coletas."
      action={onCreate ? { label: "Cadastrar Fornecedor", onClick: onCreate } : undefined}
    />
  );
}

export function EmptyTransportadoras({ onCreate }: { onCreate?: () => void }) {
  return (
    <EmptyState
      icon={Truck}
      title="Nenhuma transportadora cadastrada"
      description="Cadastre transportadoras para gerenciar fretes."
      action={onCreate ? { label: "Cadastrar Transportadora", onClick: onCreate } : undefined}
    />
  );
}

export function EmptyOcorrencias() {
  return (
    <EmptyState
      icon={AlertTriangle}
      title="Nenhuma ocorrência registrada"
      description="Ótimo! Não há ocorrências pendentes no momento."
    />
  );
}

export function EmptyNotifications() {
  return (
    <EmptyState
      icon={Bell}
      title="Nenhuma notificação"
      description="Você está em dia! Não há notificações no momento."
    />
  );
}

export function EmptyRanking() {
  return (
    <EmptyState
      icon={Trophy}
      title="Ranking vazio"
      description="Complete atividades para ganhar XP e aparecer no ranking!"
    />
  );
}

export function EmptyConfig() {
  return (
    <EmptyState
      icon={Settings}
      title="Configurações pendentes"
      description="Configure o sistema para começar a usar todos os recursos."
    />
  );
}

// Error state
export function ErrorState({ 
  title = "Erro ao carregar", 
  description = "Ocorreu um erro ao carregar os dados. Tente novamente.",
  onRetry 
}: { 
  title?: string; 
  description?: string; 
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

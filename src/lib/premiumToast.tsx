import { toast as sonnerToast, ExternalToast } from "sonner";
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Info, 
  Loader2, 
  Rocket, 
  Trophy, 
  Coins, 
  Zap, 
  Gift, 
  Bell, 
  Truck,
  Package,
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastOptions {
  title: string;
  description?: string;
  duration?: number;
  persistent?: boolean; // Toast que não some automaticamente
  dismissible?: boolean; // Permite fechar manualmente
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Custom toast container styles
const toastContainerStyles = {
  success: "bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/30",
  error: "bg-gradient-to-r from-red-500/10 to-rose-500/10 border-red-500/30",
  warning: "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30",
  info: "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/30",
  achievement: "bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-purple-500/30",
  xp: "bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border-indigo-500/30",
  coins: "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-500/30",
  levelUp: "bg-gradient-to-r from-pink-500/10 to-rose-500/10 border-pink-500/30",
  delivery: "bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-orange-500/30"
};

// Icon wrapper with glow effect
const IconWrapper = ({ 
  children, 
  color 
}: { 
  children: React.ReactNode; 
  color: string;
}) => (
  <div className={cn(
    "relative flex items-center justify-center",
    "before:absolute before:inset-0 before:rounded-full before:blur-md before:opacity-50",
    color
  )}>
    {children}
  </div>
);

// Animated icons
const SuccessIcon = () => (
  <IconWrapper color="before:bg-emerald-500">
    <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-scale-in" />
  </IconWrapper>
);

const ErrorIcon = () => (
  <IconWrapper color="before:bg-red-500">
    <XCircle className="h-5 w-5 text-red-500 animate-shake" />
  </IconWrapper>
);

const WarningIcon = () => (
  <IconWrapper color="before:bg-amber-500">
    <AlertTriangle className="h-5 w-5 text-amber-500 animate-pulse" />
  </IconWrapper>
);

const InfoIcon = () => (
  <IconWrapper color="before:bg-blue-500">
    <Info className="h-5 w-5 text-blue-500" />
  </IconWrapper>
);

const AchievementIcon = () => (
  <IconWrapper color="before:bg-purple-500">
    <Trophy className="h-5 w-5 text-purple-500 animate-bounce" />
  </IconWrapper>
);

const XPIcon = () => (
  <IconWrapper color="before:bg-indigo-500">
    <Zap className="h-5 w-5 text-indigo-500 animate-pulse" />
  </IconWrapper>
);

const CoinsIcon = () => (
  <IconWrapper color="before:bg-amber-500">
    <Coins className="h-5 w-5 text-amber-500 animate-spin-slow" />
  </IconWrapper>
);

const LevelUpIcon = () => (
  <IconWrapper color="before:bg-pink-500">
    <Rocket className="h-5 w-5 text-pink-500 animate-bounce" />
  </IconWrapper>
);

const DeliveryIcon = () => (
  <IconWrapper color="before:bg-orange-500">
    <Truck className="h-5 w-5 text-orange-500" />
  </IconWrapper>
);

export const premiumToast = {
  success: (options: ToastOptions | string) => {
    const opts = typeof options === "string" ? { title: options } : options;
    return sonnerToast.success(opts.title, {
      description: opts.description,
      duration: opts.persistent ? Infinity : (opts.duration || 4000),
      dismissible: opts.dismissible !== false,
      icon: <SuccessIcon />,
      className: toastContainerStyles.success,
      action: opts.action ? {
        label: opts.action.label,
        onClick: opts.action.onClick,
      } : undefined,
    });
  },

  error: (options: ToastOptions | string) => {
    const opts = typeof options === "string" ? { title: options } : options;
    return sonnerToast.error(opts.title, {
      description: opts.description,
      duration: opts.persistent ? Infinity : (opts.duration || 6000),
      dismissible: opts.dismissible !== false,
      icon: <ErrorIcon />,
      className: toastContainerStyles.error,
      action: opts.action ? {
        label: opts.action.label,
        onClick: opts.action.onClick,
      } : undefined,
    });
  },

  warning: (options: ToastOptions | string) => {
    const opts = typeof options === "string" ? { title: options } : options;
    return sonnerToast.warning(opts.title, {
      description: opts.description,
      duration: opts.persistent ? Infinity : (opts.duration || 5000),
      dismissible: opts.dismissible !== false,
      icon: <WarningIcon />,
      className: toastContainerStyles.warning,
      action: opts.action ? {
        label: opts.action.label,
        onClick: opts.action.onClick,
      } : undefined,
    });
  },

  info: (options: ToastOptions | string) => {
    const opts = typeof options === "string" ? { title: options } : options;
    return sonnerToast.info(opts.title, {
      description: opts.description,
      duration: opts.persistent ? Infinity : (opts.duration || 4000),
      dismissible: opts.dismissible !== false,
      icon: <InfoIcon />,
      className: toastContainerStyles.info,
      action: opts.action ? {
        label: opts.action.label,
        onClick: opts.action.onClick,
      } : undefined,
    });
  },

  loading: (title: string) => {
    return sonnerToast.loading(title, {
      icon: <Loader2 className="h-5 w-5 animate-spin text-primary" />,
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
    });
  },

  dismiss: (id?: string | number) => {
    sonnerToast.dismiss(id);
  },

  // Toast persistente para erros críticos
  criticalError: (title: string, description?: string) => {
    return sonnerToast.error(title, {
      description: description || "Um erro crítico ocorreu. Por favor, verifique.",
      duration: Infinity,
      dismissible: true,
      icon: <ErrorIcon />,
      className: `${toastContainerStyles.error} ring-2 ring-red-500/50`,
      action: {
        label: "Recarregar",
        onClick: () => window.location.reload(),
      },
    });
  },

  // Gamification toasts
  achievement: (name: string, description?: string) => {
    return sonnerToast.success(name, {
      description: description || "Nova conquista desbloqueada!",
      duration: 6000,
      icon: <AchievementIcon />,
      className: toastContainerStyles.achievement,
    });
  },

  xpGained: (amount: number, reason?: string) => {
    return sonnerToast.success(`+${amount} XP`, {
      description: reason || "Experiência adquirida!",
      duration: 3000,
      icon: <XPIcon />,
      className: toastContainerStyles.xp,
    });
  },

  coinsEarned: (amount: number, reason?: string) => {
    return sonnerToast.success(`+${amount} Moedas`, {
      description: reason || "Moedas conquistadas!",
      duration: 3000,
      icon: <CoinsIcon />,
      className: toastContainerStyles.coins,
    });
  },

  levelUp: (level: number) => {
    return sonnerToast.success(`Nível ${level}!`, {
      description: "Parabéns! Você subiu de nível!",
      duration: 8000,
      icon: <LevelUpIcon />,
      className: toastContainerStyles.levelUp,
    });
  },

  streakBonus: (days: number) => {
    return sonnerToast.success(`${days} dias de streak!`, {
      description: "Continue assim para ganhar mais bônus!",
      duration: 5000,
      icon: <Star className="h-5 w-5 text-orange-500 animate-pulse" />,
      className: "bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30",
    });
  },

  // Logistics specific toasts
  delivery: {
    dispatched: (trackingCode: string) => {
      return sonnerToast.success("Entrega Despachada", {
        description: `Código: ${trackingCode}`,
        duration: 5000,
        icon: <DeliveryIcon />,
        className: toastContainerStyles.delivery,
      });
    },
    delivered: (customerName?: string) => {
      return sonnerToast.success("Entrega Concluída", {
        description: customerName ? `Entregue para ${customerName}` : "Entrega realizada com sucesso!",
        duration: 5000,
        icon: <Package className="h-5 w-5 text-emerald-500" />,
        className: toastContainerStyles.success,
      });
    },
    delayed: (reason?: string) => {
      return sonnerToast.warning("Atraso na Entrega", {
        description: reason || "A entrega sofreu um atraso.",
        duration: 6000,
        icon: <AlertTriangle className="h-5 w-5 text-amber-500" />,
        className: toastContainerStyles.warning,
      });
    },
    issue: (description: string) => {
      return sonnerToast.error("Ocorrência Registrada", {
        description,
        duration: 8000,
        icon: <ErrorIcon />,
        className: toastContainerStyles.error,
      });
    }
  },

  // CRUD operations
  saved: (entity: string) => {
    premiumToast.success({
      title: `${entity} salvo`,
      description: "As alterações foram salvas com sucesso.",
    });
  },

  deleted: (entity: string) => {
    premiumToast.success({
      title: `${entity} excluído`,
      description: "O registro foi removido com sucesso.",
    });
  },

  created: (entity: string) => {
    premiumToast.success({
      title: `${entity} criado`,
      description: "O novo registro foi criado com sucesso.",
    });
  },

  updated: (entity: string) => {
    premiumToast.success({
      title: `${entity} atualizado`,
      description: "O registro foi atualizado com sucesso.",
    });
  },

  apiError: (error: unknown) => {
    const message = error instanceof Error ? error.message : "Ocorreu um erro inesperado";
    premiumToast.error({
      title: "Erro",
      description: message,
      persistent: true,
      action: {
        label: "Tentar novamente",
        onClick: () => window.location.reload(),
      },
    });
  },

  offline: () => {
    premiumToast.warning({
      title: "Sem conexão",
      description: "Você está offline. Algumas funcionalidades podem não funcionar.",
      persistent: true,
    });
  },

  online: () => {
    premiumToast.success({
      title: "Conectado",
      description: "Sua conexão foi restabelecida.",
    });
  },

  // Custom notification with icon
  custom: (options: ToastOptions & { icon?: React.ReactNode; type?: keyof typeof toastContainerStyles }) => {
    const toastOptions: ExternalToast = {
      description: options.description,
      duration: options.persistent ? Infinity : (options.duration || 4000),
      dismissible: options.dismissible !== false,
      icon: options.icon || <Bell className="h-5 w-5 text-primary" />,
      className: options.type ? toastContainerStyles[options.type] : undefined,
      action: options.action ? {
        label: options.action.label,
        onClick: options.action.onClick,
      } : undefined,
    };
    return sonnerToast(options.title, toastOptions);
  },
};

export default premiumToast;

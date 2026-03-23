import { LucideIcon, Package, Search, FileX, Inbox, Users, Bell, Calendar, TrendingUp, Truck, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, Variants } from "framer-motion";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
  variant?: "default" | "search" | "error" | "inbox" | "data" | "users" | "notifications" | "calendar" | "analytics" | "delivery" | "location";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
}

const variantConfig = {
  default: {
    icon: Package,
    gradient: "from-primary/20 via-primary/10 to-transparent",
    iconColor: "text-primary",
    bgPattern: "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.1) 0%, transparent 50%)"
  },
  search: {
    icon: Search,
    gradient: "from-info/20 via-info/10 to-transparent",
    iconColor: "text-info",
    bgPattern: "radial-gradient(circle at 50% 50%, hsl(var(--info) / 0.1) 0%, transparent 50%)"
  },
  error: {
    icon: FileX,
    gradient: "from-destructive/20 via-destructive/10 to-transparent",
    iconColor: "text-destructive",
    bgPattern: "radial-gradient(circle at 50% 50%, hsl(var(--destructive) / 0.1) 0%, transparent 50%)"
  },
  inbox: {
    icon: Inbox,
    gradient: "from-accent/20 via-accent/10 to-transparent",
    iconColor: "text-accent-foreground",
    bgPattern: "radial-gradient(circle at 50% 50%, hsl(var(--accent) / 0.1) 0%, transparent 50%)"
  },
  data: {
    icon: TrendingUp,
    gradient: "from-success/20 via-success/10 to-transparent",
    iconColor: "text-success",
    bgPattern: "radial-gradient(circle at 50% 50%, hsl(var(--success) / 0.1) 0%, transparent 50%)"
  },
  users: {
    icon: Users,
    gradient: "from-warning/20 via-warning/10 to-transparent",
    iconColor: "text-warning",
    bgPattern: "radial-gradient(circle at 50% 50%, hsl(var(--warning) / 0.1) 0%, transparent 50%)"
  },
  notifications: {
    icon: Bell,
    gradient: "from-primary/20 via-primary/10 to-transparent",
    iconColor: "text-primary",
    bgPattern: "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.1) 0%, transparent 50%)"
  },
  calendar: {
    icon: Calendar,
    gradient: "from-info/20 via-info/10 to-transparent",
    iconColor: "text-info",
    bgPattern: "radial-gradient(circle at 50% 50%, hsl(var(--info) / 0.1) 0%, transparent 50%)"
  },
  analytics: {
    icon: TrendingUp,
    gradient: "from-primary/20 via-primary/10 to-transparent",
    iconColor: "text-primary",
    bgPattern: "radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.1) 0%, transparent 50%)"
  },
  delivery: {
    icon: Truck,
    gradient: "from-warning/20 via-warning/10 to-transparent",
    iconColor: "text-warning",
    bgPattern: "radial-gradient(circle at 50% 50%, hsl(var(--warning) / 0.1) 0%, transparent 50%)"
  },
  location: {
    icon: MapPin,
    gradient: "from-destructive/20 via-destructive/10 to-transparent",
    iconColor: "text-destructive",
    bgPattern: "radial-gradient(circle at 50% 50%, hsl(var(--destructive) / 0.1) 0%, transparent 50%)"
  }
};

const sizeConfig = {
  sm: {
    container: "py-8 px-4",
    iconWrapper: "w-12 h-12",
    icon: "w-6 h-6",
    title: "text-base",
    description: "text-sm",
    orbitSize: 80
  },
  md: {
    container: "py-12 px-4",
    iconWrapper: "w-20 h-20",
    icon: "w-10 h-10",
    title: "text-lg",
    description: "text-sm",
    orbitSize: 120
  },
  lg: {
    container: "py-16 px-6",
    iconWrapper: "w-24 h-24",
    icon: "w-12 h-12",
    title: "text-xl",
    description: "text-base",
    orbitSize: 150
  }
};

// Floating particles animation
const FloatingParticle = ({ delay, size, duration }: { delay: number; size: number; duration: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary/20"
    style={{ width: size, height: size }}
    initial={{ opacity: 0, y: 20 }}
    animate={{
      opacity: [0, 0.5, 0],
      y: [-20, -40, -60],
      x: [0, Math.random() * 20 - 10, Math.random() * 40 - 20]
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeOut"
    }}
  />
);

// Orbit ring animation
const OrbitRing = ({ size, delay }: { size: number; delay: number }) => (
  <motion.div
    className="absolute rounded-full border border-primary/10"
    style={{ width: size, height: size }}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: [0.3, 0.1, 0.3], scale: [0.9, 1.1, 0.9] }}
    transition={{ duration: 4, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } 
  }
};

const iconVariants: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { type: "spring", stiffness: 200, damping: 15 } 
  }
};

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  secondaryAction,
  className,
  variant = "default",
  size = "md",
  animated = true
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const sizeConf = sizeConfig[size];
  const Icon = icon || config.icon;

  if (!animated) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center relative overflow-hidden",
          sizeConf.container,
          className
        )}
      >
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ background: config.bgPattern }}
        />
        <div className="relative mb-6">
          <div
            className={cn(
              "relative rounded-full flex items-center justify-center",
              `bg-gradient-to-br ${config.gradient}`,
              "backdrop-blur-sm border border-white/10",
              "shadow-lg",
              sizeConf.iconWrapper
            )}
          >
            <Icon className={cn(sizeConf.icon, config.iconColor)} strokeWidth={1.5} />
            <div className={cn(
              "absolute inset-0 rounded-full blur-xl opacity-50",
              `bg-gradient-to-br ${config.gradient}`
            )} />
          </div>
        </div>
        <h3 className={cn("font-semibold text-foreground mb-2", sizeConf.title)}>
          {title}
        </h3>
        {description && (
          <p className={cn("text-muted-foreground max-w-sm mb-6", sizeConf.description)}>
            {description}
          </p>
        )}
        {(action || secondaryAction) && (
          <div className="flex gap-3 flex-wrap justify-center">
            {action && (
              <Button onClick={action.onClick} className="gap-2" variant="default">
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button onClick={secondaryAction.onClick} variant="outline" className="gap-2">
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center justify-center text-center relative overflow-hidden",
        sizeConf.container,
        className
      )}
    >
      {/* Background gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ background: config.bgPattern }}
      />

      {/* Animated icon container */}
      <motion.div variants={iconVariants} className="relative mb-6">
        {/* Orbit rings */}
        <OrbitRing size={sizeConf.orbitSize} delay={0} />
        <OrbitRing size={sizeConf.orbitSize * 1.3} delay={0.5} />
        <OrbitRing size={sizeConf.orbitSize * 1.6} delay={1} />

        {/* Floating particles */}
        <div className="absolute inset-0 flex items-center justify-center">
          <FloatingParticle delay={0} size={4} duration={3} />
          <FloatingParticle delay={0.5} size={3} duration={2.5} />
          <FloatingParticle delay={1} size={5} duration={3.5} />
          <FloatingParticle delay={1.5} size={3} duration={2.8} />
        </div>

        {/* Icon wrapper with gradient background */}
        <motion.div
          className={cn(
            "relative rounded-full flex items-center justify-center",
            `bg-gradient-to-br ${config.gradient}`,
            "backdrop-blur-sm border border-white/10",
            "shadow-lg",
            sizeConf.iconWrapper
          )}
          whileHover={{ scale: 1.05, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Icon className={cn(sizeConf.icon, config.iconColor)} strokeWidth={1.5} />
          
          {/* Glow effect */}
          <div className={cn(
            "absolute inset-0 rounded-full blur-xl opacity-50",
            `bg-gradient-to-br ${config.gradient}`
          )} />
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.div variants={itemVariants}>
        <h3 className={cn(
          "font-semibold text-foreground mb-2",
          sizeConf.title
        )}>
          {title}
        </h3>
      </motion.div>

      {/* Description */}
      {description && (
        <motion.div variants={itemVariants}>
          <p className={cn(
            "text-muted-foreground max-w-sm mb-6",
            sizeConf.description
          )}>
            {description}
          </p>
        </motion.div>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div variants={itemVariants} className="flex gap-3 flex-wrap justify-center">
          {action && (
            <Button 
              onClick={action.onClick}
              className="gap-2"
              variant="default"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button 
              onClick={secondaryAction.onClick}
              variant="outline"
              className="gap-2"
            >
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// Preset empty states for common use cases
export const EmptyStatePresets = {
  NoResults: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      variant="search"
      title="Nenhum resultado encontrado"
      description="Tente ajustar os filtros ou termos de busca para encontrar o que procura."
      {...props}
    />
  ),
  NoData: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      variant="data"
      title="Sem dados disponíveis"
      description="Ainda não há dados para exibir neste período."
      {...props}
    />
  ),
  NoDeliveries: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      variant="delivery"
      title="Nenhuma entrega encontrada"
      description="Não há entregas registradas. Crie uma nova entrega para começar."
      {...props}
    />
  ),
  NoNotifications: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      variant="notifications"
      title="Nenhuma notificação"
      description="Você está em dia! Não há notificações pendentes."
      {...props}
    />
  ),
  NoUsers: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      variant="users"
      title="Nenhum usuário encontrado"
      description="Não há usuários cadastrados ou que correspondam aos filtros."
      {...props}
    />
  ),
  Error: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      variant="error"
      title="Algo deu errado"
      description="Não foi possível carregar os dados. Tente novamente."
      {...props}
    />
  ),
  EmptyInbox: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      variant="inbox"
      title="Caixa vazia"
      description="Não há itens na sua caixa de entrada."
      {...props}
    />
  ),
  NoEvents: (props: Partial<EmptyStateProps>) => (
    <EmptyState
      variant="calendar"
      title="Nenhum evento"
      description="Não há eventos agendados para este período."
      {...props}
    />
  )
};

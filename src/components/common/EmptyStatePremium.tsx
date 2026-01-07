import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Plus, Search, FileText, Package, Truck, Users, AlertCircle, 
  Inbox, FolderOpen, RefreshCw, Sparkles, Bell, Calendar, BarChart3
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// Animated SVG illustrations
const AnimatedIllustrations = {
  empty: () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.circle
        cx="100"
        cy="100"
        r="60"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="10 5"
        className="text-muted-foreground/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.rect
        x="70"
        y="70"
        width="60"
        height="60"
        rx="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-muted-foreground/50"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      />
      <motion.path
        d="M90 100 L100 110 L115 90"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      />
    </svg>
  ),
  search: () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.circle
        cx="85"
        cy="85"
        r="40"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-muted-foreground/40"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      />
      <motion.line
        x1="115"
        y1="115"
        x2="145"
        y2="145"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        className="text-primary"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      />
      <motion.circle
        cx="85"
        cy="85"
        r="20"
        fill="currentColor"
        className="text-primary/10"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </svg>
  ),
  error: () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.circle
        cx="100"
        cy="100"
        r="60"
        fill="currentColor"
        className="text-destructive/10"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
      />
      <motion.path
        d="M80 80 L120 120 M120 80 L80 120"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        className="text-destructive"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      />
    </svg>
  ),
  data: () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {[40, 80, 120, 160].map((x, i) => (
        <motion.rect
          key={i}
          x={x - 12}
          y={160 - (40 + i * 20)}
          width="24"
          height={40 + i * 20}
          rx="4"
          fill="currentColor"
          className={i === 3 ? "text-primary" : "text-muted-foreground/30"}
          initial={{ height: 0, y: 160 }}
          animate={{ height: 40 + i * 20, y: 160 - (40 + i * 20) }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
        />
      ))}
    </svg>
  ),
  delivery: () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.path
        d="M30 130 Q 100 80, 170 130"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="5 5"
        className="text-muted-foreground/40"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1 }}
      />
      <motion.g
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 60, opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
      >
        <rect x="40" y="100" width="40" height="25" rx="4" fill="currentColor" className="text-primary" />
        <circle cx="50" cy="130" r="6" fill="currentColor" className="text-foreground" />
        <circle cx="70" cy="130" r="6" fill="currentColor" className="text-foreground" />
        <rect x="65" y="105" width="20" height="15" rx="2" fill="currentColor" className="text-primary-foreground/50" />
      </motion.g>
      <motion.circle
        cx="160"
        cy="120"
        r="8"
        fill="currentColor"
        className="text-primary"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </svg>
  ),
  inbox: () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      <motion.rect
        x="40"
        y="60"
        width="120"
        height="100"
        rx="8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-muted-foreground/40"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      />
      <motion.path
        d="M40 100 L100 140 L160 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.3 }}
      />
      <motion.circle
        cx="100"
        cy="85"
        r="15"
        fill="currentColor"
        className="text-primary/20"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </svg>
  ),
  users: () => (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {[60, 100, 140].map((x, i) => (
        <motion.g key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.15 }}>
          <circle cx={x} cy={80 + (i === 1 ? -10 : 0)} r="20" fill="currentColor" className={i === 1 ? "text-primary" : "text-muted-foreground/40"} />
          <circle cx={x} cy={70 + (i === 1 ? -10 : 0)} r="10" fill="currentColor" className={i === 1 ? "text-primary/80" : "text-muted-foreground/30"} />
        </motion.g>
      ))}
    </svg>
  )
};

type IllustrationType = keyof typeof AnimatedIllustrations;

const iconMap: Record<string, LucideIcon> = {
  delivery: Truck,
  search: Search,
  data: BarChart3,
  users: Users,
  package: Package,
  inbox: Inbox,
  folder: FolderOpen,
  file: FileText,
  bell: Bell,
  calendar: Calendar,
  empty: Package,
  error: AlertCircle
};

interface EmptyStatePremiumProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'default' | 'search' | 'error' | 'minimal' | 'compact';
  illustration?: IllustrationType;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTip?: boolean;
  tipContent?: string;
}

export function EmptyStatePremium({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
  illustration = 'empty',
  className,
  size = 'md',
  showTip = false,
  tipContent
}: EmptyStatePremiumProps) {
  const IllustrationComponent = AnimatedIllustrations[illustration] || AnimatedIllustrations.empty;
  const IconComponent = icon || iconMap[illustration] || Package;

  const sizeClasses = {
    sm: { container: 'py-8 px-4', icon: 'w-16 h-16', title: 'text-lg', desc: 'text-sm' },
    md: { container: 'py-12 px-6', icon: 'w-24 h-24', title: 'text-xl', desc: 'text-base' },
    lg: { container: 'py-16 px-8', icon: 'w-32 h-32', title: 'text-2xl', desc: 'text-lg' }
  };

  const sizes = sizeClasses[size];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn("text-center py-8", className)}
      >
        <IconComponent className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">{title}</p>
        {actionLabel && onAction && (
          <Button variant="link" size="sm" onClick={onAction} className="mt-2">
            {actionLabel}
          </Button>
        )}
      </motion.div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn("flex items-center gap-4 p-4 rounded-lg border border-dashed border-border bg-muted/30", className)}
      >
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <IconComponent className="w-6 h-6 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
        {actionLabel && onAction && (
          <Button size="sm" variant="outline" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </motion.div>
    );
  }

  // Error variant
  if (variant === 'error') {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn("flex flex-col items-center justify-center", sizes.container, className)}
      >
        <motion.div
          variants={itemVariants}
          className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6"
        >
          <AlertCircle className="w-10 h-10 text-destructive" />
        </motion.div>
        <motion.h3 variants={itemVariants} className={cn("font-semibold text-foreground mb-2", sizes.title)}>
          {title}
        </motion.h3>
        <motion.p variants={itemVariants} className={cn("text-muted-foreground text-center max-w-md mb-6", sizes.desc)}>
          {description}
        </motion.p>
        <motion.div variants={itemVariants} className="flex gap-3">
          {actionLabel && onAction && (
            <Button onClick={onAction} variant="destructive" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button onClick={onSecondaryAction} variant="outline">
              {secondaryActionLabel}
            </Button>
          )}
        </motion.div>
      </motion.div>
    );
  }

  // Default variant with animated illustration
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn("flex flex-col items-center justify-center", sizes.container, className)}
    >
      {/* Animated Illustration */}
      <motion.div
        variants={itemVariants}
        className="relative mb-8"
      >
        {/* Background glow */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute inset-0 rounded-full bg-primary/10 blur-xl"
          style={{ width: '120%', height: '120%', left: '-10%', top: '-10%' }}
        />
        
        {/* Main illustration container */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className={cn("relative", sizes.icon)}
        >
          <IllustrationComponent />
        </motion.div>

        {/* Floating particles */}
        <motion.div
          animate={{
            y: [-5, 5, -5],
            x: [-3, 3, -3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary/30"
        />
        <motion.div
          animate={{
            y: [5, -5, 5],
            x: [3, -3, 3]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-1 -left-3 w-3 h-3 rounded-full bg-accent/40"
        />
      </motion.div>

      {/* Content */}
      <motion.h3
        variants={itemVariants}
        className={cn("font-bold text-foreground mb-3 text-center", sizes.title)}
      >
        {title}
      </motion.h3>
      
      <motion.p
        variants={itemVariants}
        className={cn("text-muted-foreground text-center max-w-md mb-8 leading-relaxed", sizes.desc)}
      >
        {description}
      </motion.p>

      {/* Actions */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3 justify-center">
        {actionLabel && onAction && (
          <Button onClick={onAction} size={size === 'sm' ? 'sm' : 'lg'} className="gap-2">
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button onClick={onSecondaryAction} variant="outline" size={size === 'sm' ? 'sm' : 'lg'}>
            {secondaryActionLabel}
          </Button>
        )}
      </motion.div>

      {/* Tips section */}
      {(showTip || variant === 'search') && (
        <motion.div
          variants={itemVariants}
          className="mt-8 p-4 rounded-lg bg-muted/50 border border-border max-w-md"
        >
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              {tipContent || (variant === 'search' 
                ? 'Tente usar termos mais genéricos ou verifique a ortografia'
                : 'Clique no botão acima para começar!'
              )}
            </p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Preset empty states for common use cases
export function NoResultsFound({ 
  searchTerm, 
  onClear,
  className 
}: { 
  searchTerm?: string; 
  onClear?: () => void;
  className?: string;
}) {
  return (
    <EmptyStatePremium
      illustration="search"
      variant="search"
      title={searchTerm ? `Nenhum resultado para "${searchTerm}"` : "Nenhum resultado encontrado"}
      description="Tente ajustar seus filtros ou termos de busca para encontrar o que procura."
      actionLabel={onClear ? "Limpar busca" : undefined}
      onAction={onClear}
      className={className}
    />
  );
}

export function NoDataYet({ 
  entityName = "dados",
  onAdd,
  className 
}: { 
  entityName?: string;
  onAdd?: () => void;
  className?: string;
}) {
  return (
    <EmptyStatePremium
      illustration="data"
      title={`Nenhum ${entityName} ainda`}
      description={`Você ainda não tem ${entityName} cadastrados. Comece adicionando o primeiro!`}
      actionLabel={`Adicionar ${entityName}`}
      onAction={onAdd}
      className={className}
    />
  );
}

export function ConnectionError({ 
  onRetry,
  className 
}: { 
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <EmptyStatePremium
      illustration="error"
      variant="error"
      title="Erro de conexão"
      description="Não foi possível carregar os dados. Verifique sua conexão e tente novamente."
      actionLabel="Tentar novamente"
      onAction={onRetry}
      className={className}
    />
  );
}

export function NoNotifications({ className }: { className?: string }) {
  return (
    <EmptyStatePremium
      illustration="inbox"
      title="Nenhuma notificação"
      description="Você está em dia! Novas notificações aparecerão aqui."
      size="sm"
      className={className}
    />
  );
}

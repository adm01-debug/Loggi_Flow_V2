import { motion } from 'framer-motion';
import { LucideIcon, Plus, Search, FileText, Package, Truck, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStatePremiumProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'default' | 'search' | 'error' | 'minimal';
  illustration?: 'delivery' | 'search' | 'data' | 'users' | 'package';
  className?: string;
}

const illustrations = {
  delivery: Truck,
  search: Search,
  data: FileText,
  users: Users,
  package: Package
};

export function EmptyStatePremium({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default',
  illustration = 'data',
  className
}: EmptyStatePremiumProps) {
  const IllustrationIcon = icon || illustrations[illustration];

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

  if (variant === 'minimal') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn("text-center py-8", className)}
      >
        <IllustrationIcon className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">{title}</p>
        {actionLabel && onAction && (
          <Button variant="link" size="sm" onClick={onAction} className="mt-2">
            {actionLabel}
          </Button>
        )}
      </motion.div>
    );
  }

  if (variant === 'error') {
    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "flex flex-col items-center justify-center py-12 px-6",
          className
        )}
      >
        <motion.div
          variants={itemVariants}
          className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6"
        >
          <AlertCircle className="w-10 h-10 text-destructive" />
        </motion.div>
        <motion.h3 variants={itemVariants} className="text-xl font-semibold text-foreground mb-2">
          {title}
        </motion.h3>
        <motion.p variants={itemVariants} className="text-muted-foreground text-center max-w-md mb-6">
          {description}
        </motion.p>
        {actionLabel && onAction && (
          <motion.div variants={itemVariants}>
            <Button onClick={onAction} variant="destructive">
              {actionLabel}
            </Button>
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6",
        className
      )}
    >
      {/* Animated Illustration */}
      <motion.div
        variants={itemVariants}
        className="relative mb-8"
      >
        {/* Background circles */}
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
          className="absolute inset-0 w-32 h-32 rounded-full bg-primary/10 -m-4"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
          className="absolute inset-0 w-40 h-40 rounded-full bg-primary/5 -m-8"
        />
        
        {/* Main icon container */}
        <motion.div
          whileHover={{ scale: 1.05, rotate: 5 }}
          className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 
                     flex items-center justify-center shadow-lg border border-primary/10"
        >
          <IllustrationIcon className="w-12 h-12 text-primary" />
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
        className="text-2xl font-bold text-foreground mb-3 text-center"
      >
        {title}
      </motion.h3>
      
      <motion.p
        variants={itemVariants}
        className="text-muted-foreground text-center max-w-md mb-8 leading-relaxed"
      >
        {description}
      </motion.p>

      {/* Actions */}
      <motion.div variants={itemVariants} className="flex flex-wrap gap-3 justify-center">
        {actionLabel && onAction && (
          <Button onClick={onAction} size="lg" className="gap-2">
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button onClick={onSecondaryAction} variant="outline" size="lg">
            {secondaryActionLabel}
          </Button>
        )}
      </motion.div>

      {/* Tips section */}
      {variant === 'search' && (
        <motion.div
          variants={itemVariants}
          className="mt-8 p-4 rounded-lg bg-muted/50 border border-border max-w-md"
        >
          <p className="text-sm text-muted-foreground text-center">
            💡 <strong>Dica:</strong> Tente usar termos mais genéricos ou verifique a ortografia
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

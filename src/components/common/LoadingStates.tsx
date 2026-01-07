import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2, Box, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Spinner Premium com logo
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'ring' | 'logo';
  className?: string;
  label?: string;
}

export function Spinner({ 
  size = 'md', 
  variant = 'default',
  className,
  label 
}: SpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const labelSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {variant === 'default' && (
        <Loader2 className={cn(sizeClasses[size], "animate-spin text-primary")} />
      )}

      {variant === 'dots' && (
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn(
                "rounded-full bg-primary",
                size === 'sm' && 'w-1.5 h-1.5',
                size === 'md' && 'w-2 h-2',
                size === 'lg' && 'w-3 h-3',
                size === 'xl' && 'w-4 h-4'
              )}
              animate={{
                y: [0, -8, 0],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.15
              }}
            />
          ))}
        </div>
      )}

      {variant === 'pulse' && (
        <motion.div
          className={cn(sizeClasses[size], "rounded-full bg-primary/20")}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <motion.div
            className="w-full h-full rounded-full bg-primary"
            animate={{
              scale: [0.8, 1, 0.8],
              opacity: [1, 0.7, 1]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      )}

      {variant === 'ring' && (
        <div className={cn(sizeClasses[size], "relative")}>
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/20"
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      )}

      {variant === 'logo' && (
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className={cn(
            sizeClasses[size],
            "rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30"
          )}
        >
          <Box className={cn(
            "text-primary-foreground",
            size === 'sm' && 'w-2 h-2',
            size === 'md' && 'w-4 h-4',
            size === 'lg' && 'w-6 h-6',
            size === 'xl' && 'w-8 h-8'
          )} />
        </motion.div>
      )}

      {label && (
        <p className={cn("text-muted-foreground", labelSizes[size])}>{label}</p>
      )}
    </div>
  );
}

// Full Page Loading
interface FullPageLoadingProps {
  message?: string;
  submessage?: string;
}

export function FullPageLoading({ 
  message = "Carregando...",
  submessage 
}: FullPageLoadingProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring" }}
        className="flex flex-col items-center gap-6"
      >
        <Spinner variant="logo" size="xl" />
        <div className="text-center space-y-1">
          <motion.p 
            className="text-lg font-medium"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {message}
          </motion.p>
          {submessage && (
            <p className="text-sm text-muted-foreground">{submessage}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Inline Loading
interface InlineLoadingProps {
  text?: string;
  className?: string;
}

export function InlineLoading({ 
  text = "Carregando",
  className 
}: InlineLoadingProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Loader2 className="w-4 h-4 animate-spin" />
      <motion.span
        animate={{ opacity: [1, 0.5, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {text}
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ...
        </motion.span>
      </motion.span>
    </span>
  );
}

// Button Loading State
interface ButtonLoadingProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
}

export function ButtonLoading({
  isLoading,
  loadingText = "Aguarde...",
  children,
  className,
  onClick,
  disabled,
  variant = 'default'
}: ButtonLoadingProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      variant={variant}
      className={cn("relative overflow-hidden", className)}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            {loadingText}
          </motion.span>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}

// Loading Overlay
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  blur?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({
  isLoading,
  message,
  blur = true,
  className,
  children
}: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "absolute inset-0 z-10 flex items-center justify-center bg-background/80",
              blur && "backdrop-blur-sm"
            )}
          >
            <Spinner variant="dots" size="lg" label={message} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Progress Loading
interface ProgressLoadingProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressLoading({
  progress,
  label,
  showPercentage = true,
  className
}: ProgressLoadingProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showPercentage && (
            <span className="font-medium tabular-nums">{Math.round(progress)}%</span>
          )}
        </div>
      )}
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// Steps Loading
interface Step {
  label: string;
  status: 'pending' | 'loading' | 'complete' | 'error';
}

interface StepsLoadingProps {
  steps: Step[];
  className?: string;
}

export function StepsLoading({ steps, className }: StepsLoadingProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {steps.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-3"
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
            step.status === 'pending' && "bg-muted text-muted-foreground",
            step.status === 'loading' && "bg-primary/20 text-primary",
            step.status === 'complete' && "bg-green-500/20 text-green-500",
            step.status === 'error' && "bg-destructive/20 text-destructive"
          )}>
            {step.status === 'pending' && <span className="text-xs font-medium">{index + 1}</span>}
            {step.status === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
            {step.status === 'complete' && <CheckCircle2 className="w-4 h-4" />}
            {step.status === 'error' && <AlertCircle className="w-4 h-4" />}
          </div>
          <span className={cn(
            "text-sm transition-colors",
            step.status === 'pending' && "text-muted-foreground",
            step.status === 'loading' && "text-foreground font-medium",
            step.status === 'complete' && "text-muted-foreground",
            step.status === 'error' && "text-destructive"
          )}>
            {step.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// Retry State
interface RetryStateProps {
  message?: string;
  onRetry: () => void;
  className?: string;
}

export function RetryState({
  message = "Algo deu errado. Tente novamente.",
  onRetry,
  className
}: RetryStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-8 text-center",
        className
      )}
    >
      <motion.div
        animate={{ rotate: [0, -10, 10, 0] }}
        transition={{ duration: 0.5 }}
        className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center"
      >
        <AlertCircle className="w-8 h-8 text-destructive" />
      </motion.div>
      <p className="text-muted-foreground">{message}</p>
      <Button onClick={onRetry} variant="outline" className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Tentar novamente
      </Button>
    </motion.div>
  );
}

// Skeleton Pulse Animation
export function SkeletonPulse({ className }: { className?: string }) {
  return (
    <motion.div
      className={cn("bg-muted rounded-md", className)}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

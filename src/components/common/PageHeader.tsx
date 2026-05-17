import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  actions?: ReactNode;
  children?: ReactNode;
  showBack?: boolean;
  backFallback?: string;
}

export function PageHeader({ title, description, icon: Icon, iconClassName, actions, children, showBack = true, backFallback }: PageHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4 mb-8"
    >
      <div className="flex flex-col gap-3">
        {/* Back button row handled by MainLayout */}

        
        {/* Title row */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between group">
          <div className="flex items-center gap-4">
            {Icon && (
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className={cn(
                  "flex items-center justify-center w-14 h-14 rounded-2xl",
                  "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent",
                  "border border-primary/20 shadow-lg shadow-primary/5 transition-all",
                  iconClassName
                )}
              >
                <Icon className="w-7 h-7 text-primary" />
              </motion.div>
            )}
            <div className="flex flex-col gap-0.5">
              <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none uppercase">
                {title}
              </h1>
              {description && (
                <p className="text-sm md:text-base text-muted-foreground font-medium opacity-80 max-w-2xl leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
          
          {(actions || children) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3 p-1 bg-accent/20 backdrop-blur-sm rounded-xl border border-border/50"
            >
              {actions}{children}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

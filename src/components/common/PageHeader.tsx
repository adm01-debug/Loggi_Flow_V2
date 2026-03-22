import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageBackButton } from "./PageBackButton";

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
    <div className="flex flex-col gap-3">
      {/* Back button row */}
      {showBack && <PageBackButton fallbackPath={backFallback} />}
      
      {/* Title row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn("flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10", iconClassName)}>
              <Icon className="w-6 h-6 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-display text-foreground">{title}</h1>
            {description && <p className="text-muted-foreground mt-1">{description}</p>}
          </div>
        </div>
        {(actions || children) && <div className="flex items-center gap-2">{actions}{children}</div>}
      </div>
    </div>
  );
}

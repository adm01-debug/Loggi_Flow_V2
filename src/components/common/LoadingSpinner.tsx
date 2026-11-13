import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "default" | "lg";
  className?: string;
  text?: string;
}

const sizes = { sm: "w-4 h-4", default: "w-6 h-6", lg: "w-8 h-8" };

export function LoadingSpinner({
  size = "default",
  className,
  text,
}: LoadingSpinnerProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-primary", sizes[size])} />
      {text && <span className="text-muted-foreground text-sm">{text}</span>}
    </div>
  );
}

export function PageLoader({ text = "Carregando..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground mt-4">{text}</p>
    </div>
  );
}

export function InlineLoader() {
  return <Loader2 className="w-4 h-4 animate-spin inline" />;
}

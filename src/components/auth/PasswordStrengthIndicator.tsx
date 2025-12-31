import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

interface PasswordCriteria {
  label: string;
  met: boolean;
}

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  const analysis = useMemo(() => {
    const criteria: PasswordCriteria[] = [
      { label: "Mínimo 8 caracteres", met: password.length >= 8 },
      { label: "Letra maiúscula", met: /[A-Z]/.test(password) },
      { label: "Letra minúscula", met: /[a-z]/.test(password) },
      { label: "Número", met: /[0-9]/.test(password) },
      { label: "Caractere especial (!@#$%...)", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
    ];

    const metCount = criteria.filter((c) => c.met).length;
    const strength = password.length === 0 ? 0 : Math.round((metCount / criteria.length) * 100);

    let level: "weak" | "fair" | "good" | "strong" = "weak";
    let label = "Muito fraca";
    let color = "bg-destructive";

    if (strength >= 80) {
      level = "strong";
      label = "Forte";
      color = "bg-green-500";
    } else if (strength >= 60) {
      level = "good";
      label = "Boa";
      color = "bg-yellow-500";
    } else if (strength >= 40) {
      level = "fair";
      label = "Regular";
      color = "bg-orange-500";
    }

    return { criteria, strength, level, label, color };
  }, [password]);

  if (!password) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Força da senha</span>
          <span
            className={cn(
              "font-medium",
              analysis.level === "strong" && "text-green-500",
              analysis.level === "good" && "text-yellow-500",
              analysis.level === "fair" && "text-orange-500",
              analysis.level === "weak" && "text-destructive"
            )}
          >
            {analysis.label}
          </span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              analysis.color
            )}
            style={{ width: `${analysis.strength}%` }}
          />
        </div>
      </div>

      {/* Criteria checklist */}
      <div className="grid grid-cols-1 gap-1">
        {analysis.criteria.map((criterion, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              criterion.met ? "text-green-500" : "text-muted-foreground"
            )}
          >
            {criterion.met ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
            <span>{criterion.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useMemo, useState, useEffect } from "react";
import { Check, X, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
  onStrengthChange?: (isStrong: boolean, isPwned: boolean) => void;
}

interface PasswordCriteria {
  label: string;
  met: boolean;
  required: boolean;
}

export function PasswordStrengthIndicator({ 
  password, 
  className,
  onStrengthChange 
}: PasswordStrengthIndicatorProps) {
  const [isPwned, setIsPwned] = useState(false);
  const [pwnedCount, setPwnedCount] = useState(0);
  const [isCheckingPwned, setIsCheckingPwned] = useState(false);
  const debouncedPassword = useDebounce(password, 500);

  const analysis = useMemo(() => {
    const criteria: PasswordCriteria[] = [
      { label: "Mínimo 8 caracteres", met: password.length >= 8, required: true },
      { label: "Letra maiúscula", met: /[A-Z]/.test(password), required: false },
      { label: "Letra minúscula", met: /[a-z]/.test(password), required: false },
      { label: "Número", met: /\d/.test(password), required: false },
      { label: "Caractere especial (!@#$%...)", met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password), required: true },
    ];

    const requiredCriteria = criteria.filter(c => c.required);
    const allRequiredMet = requiredCriteria.every(c => c.met);
    const metCount = criteria.filter((c) => c.met).length;
    const strength = password.length === 0 ? 0 : Math.round((metCount / criteria.length) * 100);

    let level: "weak" | "fair" | "good" | "strong" = "weak";
    let label = "Muito fraca";
    let color = "bg-destructive";

    if (strength >= 80 && allRequiredMet) {
      level = "strong";
      label = "Forte";
      color = "bg-success";
    } else if (strength >= 60 && allRequiredMet) {
      level = "good";
      label = "Boa";
      color = "bg-warning";
    } else if (strength >= 40) {
      level = "fair";
      label = "Regular";
      color = "bg-warning/70";
    }

    return { criteria, strength, level, label, color, allRequiredMet };
  }, [password]);

  // Check for pwned passwords
  useEffect(() => {
    const checkPwned = async () => {
      if (debouncedPassword.length < 8) {
        setIsPwned(false);
        setPwnedCount(0);
        return;
      }

      setIsCheckingPwned(true);
      try {
        const { data, error } = await supabase.functions.invoke("check-password-breach", {
          body: { password: debouncedPassword },
        });

        if (!error && data) {
          setIsPwned(data.pwned);
          setPwnedCount(data.count || 0);
        }
      } catch {
        // Silent fail - breach check is non-critical
      } finally {
        setIsCheckingPwned(false);
      }
    };

    checkPwned();
  }, [debouncedPassword]);

  // Notify parent of strength changes
  useEffect(() => {
    if (onStrengthChange) {
      onStrengthChange(analysis.allRequiredMet && analysis.strength >= 60, isPwned);
    }
  }, [analysis.allRequiredMet, analysis.strength, isPwned, onStrengthChange]);

  if (!password) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Força da senha</span>
          <span className={cn(
            "font-medium",
            analysis.level === "strong" && "text-success",
            analysis.level === "good" && "text-warning",
            analysis.level === "fair" && "text-warning/70",
            analysis.level === "weak" && "text-destructive"
          )}>
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
        {analysis.criteria.map((criterion, index) => {
          let textColor = "text-muted-foreground";
          if (criterion.met) {
            textColor = "text-success";
          } else if (criterion.required) {
            textColor = "text-destructive";
          }

          return (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                textColor
              )}
            >
            {criterion.met ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
            <span>
              {criterion.label}
              {criterion.required && !criterion.met && (
                <span className="ml-1 text-destructive">(obrigatório)</span>
              )}
            </span>
            </div>
          );
        })}
      </div>

      {/* Pwned password check */}
      <div className="pt-2 border-t border-border">
        {(() => {
          if (isCheckingPwned) {
            return (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Verificando vazamentos...</span>
              </div>
            );
          }
          
          if (isPwned) {
            return (
              <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded-md">
                <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Senha comprometida!</p>
                  <p className="text-destructive/80">
                    Esta senha foi encontrada em {pwnedCount.toLocaleString()} vazamentos. Escolha outra.
                  </p>
                </div>
              </div>
            );
          }
          
          if (password.length >= 8) {
            return (
              <div className="flex items-center gap-2 text-xs text-success">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Senha não encontrada em vazamentos conhecidos</span>
              </div>
            );
          }
          
          return null;
        })()}
      </div>
    </div>
  );
}

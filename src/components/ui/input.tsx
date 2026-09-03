import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Search, X, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const inputVariants = cva(
  "flex w-full rounded-lg border bg-background text-foreground transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-50 touch-manipulation",
  {
    variants: {
      variant: {
        default:
          "border-input focus:border-primary focus:ring-2 focus:ring-primary/20",
        filled:
          "border-transparent bg-muted focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20",
        ghost:
          "border-transparent bg-transparent focus:bg-muted/50 focus:border-border",
        error:
          "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20",
        success:
          "border-success focus:border-success focus:ring-2 focus:ring-success/20",
      },
      inputSize: {
        default: "h-11 min-h-[44px] px-3 py-2 text-base sm:text-sm",
        sm: "h-9 min-h-[36px] px-2.5 py-1.5 text-sm rounded-md",
        lg: "h-12 min-h-[48px] px-4 py-3 text-base rounded-xl",
        xl: "h-14 min-h-[56px] px-5 py-4 text-lg rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  },
);

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  hint?: string;
  clearable?: boolean;
  onClear?: () => void;
  animated?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant,
      inputSize,
      leftIcon,
      rightIcon,
      error,
      hint,
      clearable,
      onClear,
      animated = true,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const isPassword = type === "password";
    const inputType = ((): typeof type => {
      if (!isPassword) return type;
      return showPassword ? "text" : "password";
    })();

    const hasValue = props.value !== undefined && props.value !== "";

    return (
      <div className="relative w-full">
        <div className="relative group">
          {/* Animated focus ring */}
          {animated && (
            <motion.div
              className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-0 blur-sm transition-opacity pointer-events-none"
              animate={{ opacity: isFocused ? 0.3 : 0 }}
              transition={{ duration: 0.2 }}
            />
          )}

          {leftIcon && (
            <motion.div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10"
              animate={{
                scale: isFocused ? 1.1 : 1,
                color: isFocused
                  ? "hsl(var(--primary))"
                  : "hsl(var(--muted-foreground))",
              }}
              transition={{ duration: 0.2 }}
            >
              {leftIcon}
            </motion.div>
          )}
          <input
            type={inputType}
            className={cn(
              inputVariants({ variant: error ? "error" : variant, inputSize }),
              leftIcon && "pl-10",
              (rightIcon || isPassword || clearable) && "pr-10",
              "relative z-0",
              className,
            )}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
            <AnimatePresence>
              {clearable && hasValue && (
                <motion.button
                  type="button"
                  onClick={onClear}
                  className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  aria-label="Limpar campo"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
            {isPassword && (
              <motion.button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                whileTap={{ scale: 0.9 }}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </motion.button>
            )}
            {rightIcon && !isPassword && !clearable && (
              <span className="text-muted-foreground pointer-events-none p-1">
                {rightIcon}
              </span>
            )}
          </div>
        </div>
        <AnimatePresence>
          {(error || hint) && (
            <motion.p
              className={cn(
                "mt-1.5 text-xs font-medium",
                error ? "text-destructive" : "text-muted-foreground",
              )}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              {error || hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  },
);
Input.displayName = "Input";

// ============================================
// SEARCH INPUT - Pre-styled search variant
// ============================================

interface SearchInputProps extends Omit<InputProps, "leftIcon" | "type"> {
  onSearch?: (value: string) => void;
}

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={<Search className="w-4 h-4" />}
        className={cn("", className)}
        clearable
        {...props}
      />
    );
  },
);
SearchInput.displayName = "SearchInput";

export { Input, SearchInput, inputVariants };

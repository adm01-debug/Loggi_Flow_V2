import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Search, X, Eye, EyeOff } from "lucide-react";

const inputVariants = cva(
  "flex w-full rounded-lg border bg-background text-foreground transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-input focus:border-primary focus:ring-2 focus:ring-primary/20",
        filled: "border-transparent bg-muted focus:bg-background focus:border-primary focus:ring-2 focus:ring-primary/20",
        ghost: "border-transparent bg-transparent focus:bg-muted/50 focus:border-border",
        error: "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20",
        success: "border-success focus:border-success focus:ring-2 focus:ring-success/20",
      },
      inputSize: {
        default: "h-10 px-3 py-2 text-sm",
        sm: "h-8 px-2.5 py-1.5 text-xs rounded-md",
        lg: "h-12 px-4 py-3 text-base rounded-xl",
        xl: "h-14 px-5 py-4 text-lg rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
  hint?: string;
  clearable?: boolean;
  onClear?: () => void;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, leftIcon, rightIcon, error, hint, clearable, onClear, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    const hasValue = props.value !== undefined && props.value !== "";

    return (
      <div className="relative w-full">
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            type={inputType}
            className={cn(
              inputVariants({ variant: error ? "error" : variant, inputSize }),
              leftIcon && "pl-10",
              (rightIcon || isPassword || clearable) && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {clearable && hasValue && (
              <button
                type="button"
                onClick={onClear}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
            {rightIcon && !isPassword && !clearable && (
              <span className="text-muted-foreground pointer-events-none">{rightIcon}</span>
            )}
          </div>
        </div>
        {(error || hint) && (
          <p className={cn("mt-1.5 text-xs font-medium", error ? "text-destructive" : "text-muted-foreground")}>
            {error || hint}
          </p>
        )}
      </div>
    );
  }
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
  }
);
SearchInput.displayName = "SearchInput";

export { Input, SearchInput, inputVariants };
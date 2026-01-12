import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, X, Check, AlertCircle } from "lucide-react";

interface FloatingInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "placeholder"> {
  label: string;
  error?: string;
  hint?: string;
  success?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ className, type, label, error, hint, success, clearable, onClear, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(!!props.value || !!props.defaultValue);
    const inputRef = React.useRef<HTMLInputElement>(null);
    
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;
    const isFloating = isFocused || hasValue;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    const handleClear = () => {
      setHasValue(false);
      if (inputRef.current) {
        inputRef.current.value = "";
        inputRef.current.focus();
      }
      onClear?.();
    };

    const getBorderColor = () => {
      if (error) return "border-destructive focus-within:border-destructive focus-within:ring-destructive/20";
      if (success) return "border-success focus-within:border-success focus-within:ring-success/20";
      return "border-input focus-within:border-primary focus-within:ring-primary/20";
    };

    const getLabelColor = () => {
      if (error) return "text-destructive";
      if (success) return "text-success";
      if (isFocused) return "text-primary";
      return "text-muted-foreground";
    };

    return (
      <div className="relative w-full">
        <div 
          className={cn(
            "relative rounded-lg border bg-background transition-all duration-200",
            "focus-within:ring-2",
            getBorderColor(),
            className
          )}
        >
          {/* Floating Label */}
          <motion.label
            htmlFor={props.id}
            className={cn(
              "absolute left-3 cursor-text pointer-events-none z-10",
              "bg-background px-1",
              "transition-colors duration-200",
              getLabelColor()
            )}
            animate={{
              y: isFloating ? -12 : 12,
              scale: isFloating ? 0.85 : 1,
              x: isFloating ? -4 : 0,
            }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {label}
          </motion.label>

          <input
            ref={(node) => {
              // Handle both refs
              if (typeof ref === "function") ref(node);
              else if (ref) ref.current = node;
              (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }}
            type={inputType}
            className={cn(
              "flex h-12 w-full rounded-lg bg-transparent px-3 py-3 text-base",
              "transition-all duration-200",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "outline-none",
              isPassword || clearable ? "pr-10" : "",
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />

          {/* Action buttons */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <AnimatePresence>
              {clearable && hasValue && !isPassword && (
                <motion.button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  aria-label="Limpar"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {isPassword && (
              <motion.button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                whileTap={{ scale: 0.9 }}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </motion.button>
            )}

            {success && !isPassword && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-1"
              >
                <Check className="w-4 h-4 text-success" />
              </motion.div>
            )}

            {error && !isPassword && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-1"
              >
                <AlertCircle className="w-4 h-4 text-destructive" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Error/Hint message */}
        <AnimatePresence>
          {(error || hint) && (
            <motion.p
              className={cn(
                "mt-1.5 text-xs font-medium",
                error ? "text-destructive" : "text-muted-foreground"
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
  }
);

FloatingInput.displayName = "FloatingInput";

// Textarea variant with floating label
interface FloatingTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "placeholder"> {
  label: string;
  error?: string;
  hint?: string;
}

const FloatingTextarea = React.forwardRef<HTMLTextAreaElement, FloatingTextareaProps>(
  ({ className, label, error, hint, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [hasValue, setHasValue] = React.useState(!!props.value || !!props.defaultValue);
    const isFloating = isFocused || hasValue;

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setHasValue(!!e.target.value);
      props.onChange?.(e);
    };

    const getBorderColor = () => {
      if (error) return "border-destructive focus-within:border-destructive focus-within:ring-destructive/20";
      return "border-input focus-within:border-primary focus-within:ring-primary/20";
    };

    const getLabelColor = () => {
      if (error) return "text-destructive";
      if (isFocused) return "text-primary";
      return "text-muted-foreground";
    };

    return (
      <div className="relative w-full">
        <div 
          className={cn(
            "relative rounded-lg border bg-background transition-all duration-200",
            "focus-within:ring-2",
            getBorderColor(),
            className
          )}
        >
          <motion.label
            htmlFor={props.id}
            className={cn(
              "absolute left-3 cursor-text pointer-events-none z-10",
              "bg-background px-1",
              "transition-colors duration-200",
              getLabelColor()
            )}
            animate={{
              y: isFloating ? -12 : 12,
              scale: isFloating ? 0.85 : 1,
              x: isFloating ? -4 : 0,
            }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {label}
          </motion.label>

          <textarea
            ref={ref}
            className={cn(
              "flex min-h-[100px] w-full rounded-lg bg-transparent px-3 py-3 text-base",
              "transition-all duration-200 resize-y",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "outline-none",
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />
        </div>

        <AnimatePresence>
          {(error || hint) && (
            <motion.p
              className={cn(
                "mt-1.5 text-xs font-medium",
                error ? "text-destructive" : "text-muted-foreground"
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
  }
);

FloatingTextarea.displayName = "FloatingTextarea";

export { FloatingInput, FloatingTextarea };

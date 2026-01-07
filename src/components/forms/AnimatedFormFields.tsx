import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Check, X, Eye, EyeOff, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ============================================
// ANIMATED INPUT WITH FLOATING LABEL
// ============================================
interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  hint?: string;
}

export const AnimatedInput = React.forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ label, error, success, loading, icon, hint, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);
    
    const isFloating = isFocused || hasValue;
    
    return (
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Floating Label */}
        <motion.label
          className={cn(
            "absolute left-3 pointer-events-none transition-colors z-10",
            "text-muted-foreground",
            error && "text-destructive",
            success && "text-green-500",
            isFocused && !error && !success && "text-primary"
          )}
          initial={false}
          animate={{
            top: isFloating ? -8 : 12,
            fontSize: isFloating ? 12 : 14,
            backgroundColor: isFloating ? 'hsl(var(--background))' : 'transparent',
            paddingLeft: isFloating ? 4 : 0,
            paddingRight: isFloating ? 4 : 0,
          }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {label}
        </motion.label>

        {/* Input Container */}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          
          <Input
            ref={ref}
            {...props}
            className={cn(
              "h-12 transition-all duration-200",
              icon && "pl-10",
              (loading || success || error) && "pr-10",
              error && "border-destructive focus-visible:ring-destructive/20",
              success && "border-green-500 focus-visible:ring-green-500/20",
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              setHasValue(!!e.target.value);
              props.onBlur?.(e);
            }}
            onChange={(e) => {
              setHasValue(!!e.target.value);
              props.onChange?.(e);
            }}
          />

          {/* Status Icons */}
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </motion.div>
            )}
            {!loading && success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <Check className="h-4 w-4 text-green-500" />
              </motion.div>
            )}
            {!loading && error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <AlertCircle className="h-4 w-4 text-destructive" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Animated Focus Line */}
        <motion.div
          className={cn(
            "absolute bottom-0 left-0 right-0 h-0.5 rounded-full",
            error ? "bg-destructive" : success ? "bg-green-500" : "bg-primary"
          )}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isFocused ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />

        {/* Error/Hint Message */}
        <AnimatePresence>
          {(error || hint) && (
            <motion.p
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className={cn(
                "text-xs mt-1 ml-1",
                error ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {error || hint}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);
AnimatedInput.displayName = 'AnimatedInput';

// ============================================
// ANIMATED PASSWORD INPUT
// ============================================
interface AnimatedPasswordInputProps extends Omit<AnimatedInputProps, 'type'> {
  showStrength?: boolean;
}

export const AnimatedPasswordInput = React.forwardRef<HTMLInputElement, AnimatedPasswordInputProps>(
  ({ showStrength, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');
    
    const calculateStrength = (pwd: string): number => {
      let strength = 0;
      if (pwd.length >= 8) strength += 25;
      if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 25;
      if (/\d/.test(pwd)) strength += 25;
      if (/[^a-zA-Z0-9]/.test(pwd)) strength += 25;
      return strength;
    };
    
    const strength = calculateStrength(password);
    
    const getStrengthColor = () => {
      if (strength <= 25) return 'bg-red-500';
      if (strength <= 50) return 'bg-orange-500';
      if (strength <= 75) return 'bg-yellow-500';
      return 'bg-green-500';
    };
    
    const getStrengthText = () => {
      if (strength <= 25) return 'Fraca';
      if (strength <= 50) return 'Média';
      if (strength <= 75) return 'Boa';
      return 'Forte';
    };

    return (
      <div className="space-y-2">
        <div className="relative">
          <AnimatedInput
            ref={ref}
            {...props}
            type={showPassword ? 'text' : 'password'}
            onChange={(e) => {
              setPassword(e.target.value);
              props.onChange?.(e);
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <motion.div
              initial={false}
              animate={{ scale: [1, 0.8, 1] }}
              transition={{ duration: 0.2 }}
              key={showPassword ? 'show' : 'hide'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </motion.div>
          </button>
        </div>
        
        {showStrength && password && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1"
          >
            <div className="flex gap-1">
              {[25, 50, 75, 100].map((threshold) => (
                <motion.div
                  key={threshold}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    strength >= threshold ? getStrengthColor() : 'bg-muted'
                  )}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: strength >= threshold ? 1 : 0.3 }}
                  transition={{ duration: 0.3, delay: threshold / 400 }}
                />
              ))}
            </div>
            <motion.p 
              className="text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Força: <span className={cn(
                strength <= 25 && "text-red-500",
                strength > 25 && strength <= 50 && "text-orange-500",
                strength > 50 && strength <= 75 && "text-yellow-500",
                strength > 75 && "text-green-500"
              )}>{getStrengthText()}</span>
            </motion.p>
          </motion.div>
        )}
      </div>
    );
  }
);
AnimatedPasswordInput.displayName = 'AnimatedPasswordInput';

// ============================================
// ANIMATED TEXTAREA
// ============================================
interface AnimatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  maxLength?: number;
  showCount?: boolean;
}

export const AnimatedTextarea = React.forwardRef<HTMLTextAreaElement, AnimatedTextareaProps>(
  ({ label, error, maxLength, showCount, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [value, setValue] = useState(props.value?.toString() || props.defaultValue?.toString() || '');
    const isFloating = isFocused || !!value;
    
    const charCount = value.length;
    const isNearLimit = maxLength && charCount >= maxLength * 0.8;
    const isAtLimit = maxLength && charCount >= maxLength;

    return (
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.label
          className={cn(
            "absolute left-3 pointer-events-none transition-colors z-10",
            "text-muted-foreground",
            error && "text-destructive",
            isFocused && !error && "text-primary"
          )}
          animate={{
            top: isFloating ? -8 : 12,
            fontSize: isFloating ? 12 : 14,
            backgroundColor: isFloating ? 'hsl(var(--background))' : 'transparent',
            paddingLeft: isFloating ? 4 : 0,
            paddingRight: isFloating ? 4 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.label>

        <Textarea
          ref={ref}
          {...props}
          value={value}
          maxLength={maxLength}
          className={cn(
            "min-h-[100px] pt-4 transition-all duration-200",
            error && "border-destructive focus-visible:ring-destructive/20",
            className
          )}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          onChange={(e) => {
            setValue(e.target.value);
            props.onChange?.(e);
          }}
        />

        {showCount && maxLength && (
          <motion.div
            className={cn(
              "absolute bottom-2 right-2 text-xs",
              isAtLimit ? "text-destructive" : isNearLimit ? "text-yellow-500" : "text-muted-foreground"
            )}
            animate={{ scale: isNearLimit ? [1, 1.1, 1] : 1 }}
          >
            {charCount}/{maxLength}
          </motion.div>
        )}

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="text-xs text-destructive mt-1 ml-1"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);
AnimatedTextarea.displayName = 'AnimatedTextarea';

// ============================================
// ANIMATED CHECKBOX
// ============================================
interface AnimatedCheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export const AnimatedCheckbox: React.FC<AnimatedCheckboxProps> = ({
  checked = false,
  onChange,
  label,
  description,
  disabled
}) => {
  const pathLength = useMotionValue(0);
  
  return (
    <motion.label 
      className={cn(
        "flex items-start gap-3 cursor-pointer group",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      whileHover={!disabled ? { scale: 1.01 } : undefined}
      whileTap={!disabled ? { scale: 0.99 } : undefined}
    >
      <motion.div
        className={cn(
          "relative w-5 h-5 rounded border-2 transition-colors mt-0.5",
          checked 
            ? "bg-primary border-primary" 
            : "bg-background border-muted-foreground/30 group-hover:border-primary/50"
        )}
        onClick={() => !disabled && onChange?.(!checked)}
        animate={{ 
          scale: checked ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        <motion.svg
          viewBox="0 0 20 20"
          className="absolute inset-0 w-full h-full p-0.5"
        >
          <motion.path
            d="M4 10l4 4 8-8"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: checked ? 1 : 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
        </motion.svg>
        
        {/* Ripple effect */}
        <AnimatePresence>
          {checked && (
            <motion.div
              className="absolute inset-0 rounded bg-primary"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
      
      {(label || description) && (
        <div className="flex-1">
          {label && <p className="text-sm font-medium">{label}</p>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      )}
    </motion.label>
  );
};

// ============================================
// ANIMATED RADIO GROUP
// ============================================
interface RadioOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface AnimatedRadioGroupProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  name: string;
}

export const AnimatedRadioGroup: React.FC<AnimatedRadioGroupProps> = ({
  options,
  value,
  onChange,
  name
}) => {
  return (
    <div className="space-y-2">
      {options.map((option, index) => (
        <motion.label
          key={option.value}
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors",
            value === option.value 
              ? "border-primary bg-primary/5" 
              : "border-muted hover:border-primary/30"
          )}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onChange?.(option.value)}
        >
          {/* Radio Circle */}
          <div className={cn(
            "relative w-5 h-5 rounded-full border-2 transition-colors",
            value === option.value ? "border-primary" : "border-muted-foreground/30"
          )}>
            <AnimatePresence>
              {value === option.value && (
                <motion.div
                  className="absolute inset-1 rounded-full bg-primary"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </AnimatePresence>
          </div>
          
          {option.icon && (
            <div className="text-muted-foreground">
              {option.icon}
            </div>
          )}
          
          <div className="flex-1">
            <p className="text-sm font-medium">{option.label}</p>
            {option.description && (
              <p className="text-xs text-muted-foreground">{option.description}</p>
            )}
          </div>
          
          {value === option.value && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-primary"
            >
              <Check className="h-4 w-4" />
            </motion.div>
          )}
        </motion.label>
      ))}
    </div>
  );
};

// ============================================
// ANIMATED SWITCH
// ============================================
interface AnimatedSwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedSwitch: React.FC<AnimatedSwitchProps> = ({
  checked = false,
  onChange,
  label,
  description,
  disabled,
  size = 'md'
}) => {
  const sizes = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 16 },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 20 },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 28 },
  };
  
  const { track, thumb, translate } = sizes[size];

  return (
    <motion.label 
      className={cn(
        "flex items-center justify-between gap-3 cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {(label || description) && (
        <div>
          {label && <p className="text-sm font-medium">{label}</p>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      )}
      
      <motion.button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        className={cn(
          "relative rounded-full transition-colors",
          track,
          checked ? "bg-primary" : "bg-muted"
        )}
        onClick={() => !disabled && onChange?.(!checked)}
        whileTap={!disabled ? { scale: 0.95 } : undefined}
      >
        <motion.div
          className={cn(
            "absolute top-0.5 left-0.5 rounded-full bg-white shadow-sm",
            thumb
          )}
          animate={{ 
            x: checked ? translate : 0,
            scale: checked ? 1.1 : 1
          }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          {/* Icon inside thumb */}
          <AnimatePresence mode="wait">
            {checked ? (
              <motion.div
                key="check"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="w-full h-full flex items-center justify-center"
              >
                <Check className="h-2.5 w-2.5 text-primary" />
              </motion.div>
            ) : (
              <motion.div
                key="x"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="w-full h-full flex items-center justify-center"
              >
                <X className="h-2.5 w-2.5 text-muted-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.button>
    </motion.label>
  );
};

// ============================================
// FORM STEP INDICATOR
// ============================================
interface FormStep {
  id: string;
  title: string;
  description?: string;
}

interface FormStepIndicatorProps {
  steps: FormStep[];
  currentStep: number;
  completedSteps?: number[];
}

export const FormStepIndicator: React.FC<FormStepIndicatorProps> = ({
  steps,
  currentStep,
  completedSteps = []
}) => {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index);
        const isCurrent = index === currentStep;
        const isPast = index < currentStep;
        
        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center relative">
              <motion.div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                  isCompleted || isPast
                    ? "bg-primary border-primary text-primary-foreground"
                    : isCurrent
                    ? "border-primary text-primary bg-primary/10"
                    : "border-muted text-muted-foreground"
                )}
                animate={{
                  scale: isCurrent ? [1, 1.1, 1] : 1,
                }}
                transition={{ duration: 0.3, repeat: isCurrent ? Infinity : 0, repeatDelay: 2 }}
              >
                {isCompleted || isPast ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  >
                    <Check className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </motion.div>
              
              <motion.div 
                className="mt-2 text-center"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <p className={cn(
                  "text-xs font-medium",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}>
                  {step.title}
                </p>
              </motion.div>
              
              {/* Pulse for current */}
              {isCurrent && (
                <motion.div
                  className="absolute inset-0 w-10 h-10 rounded-full bg-primary"
                  initial={{ scale: 1, opacity: 0.3 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 bg-muted relative overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary"
                  initial={{ width: '0%' }}
                  animate={{ width: isPast || isCompleted ? '100%' : isCurrent ? '50%' : '0%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================
// ANIMATED SUBMIT BUTTON
// ============================================
interface AnimatedSubmitButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const AnimatedSubmitButton: React.FC<AnimatedSubmitButtonProps> = ({
  children,
  loading,
  success,
  error,
  disabled,
  onClick,
  className
}) => {
  return (
    <motion.button
      type="submit"
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "relative w-full h-12 rounded-lg font-medium transition-colors overflow-hidden",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        success && "bg-green-500 hover:bg-green-500",
        error && "bg-destructive hover:bg-destructive",
        className
      )}
      whileHover={!disabled && !loading ? { scale: 1.01 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.99 } : undefined}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Processando...</span>
          </motion.div>
        ) : success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <Check className="h-5 w-5" />
            <span>Sucesso!</span>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: [0, -5, 5, -5, 5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ x: { duration: 0.4 } }}
            className="flex items-center justify-center gap-2"
          >
            <X className="h-5 w-5" />
            <span>Erro!</span>
          </motion.div>
        ) : (
          <motion.div
            key="default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Shimmer effect */}
      {!loading && !success && !error && (
        <motion.div
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
          animate={{ translateX: ['100%', '-100%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
      )}
    </motion.button>
  );
};

export default {
  AnimatedInput,
  AnimatedPasswordInput,
  AnimatedTextarea,
  AnimatedCheckbox,
  AnimatedRadioGroup,
  AnimatedSwitch,
  FormStepIndicator,
  AnimatedSubmitButton
};

/**
 * Componentes de Validação em Tempo Real
 * 
 * @module components/forms/RealtimeFormValidation
 */

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ============================================
// Types
// ============================================

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid' | 'warning';

interface ValidationRule {
  validate: (value: string) => boolean | Promise<boolean>;
  message: string;
  type?: 'error' | 'warning' | 'info';
}

interface FieldValidation {
  status: ValidationStatus;
  message?: string;
  type?: 'error' | 'warning' | 'info';
}

// ============================================
// Validation Rules Presets
// ============================================

export const validationRules = {
  required: (message = 'Este campo é obrigatório'): ValidationRule => ({
    validate: (value) => value.trim().length > 0,
    message,
    type: 'error',
  }),
  
  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value) => value.length >= min,
    message: message || `Mínimo de ${min} caracteres`,
    type: 'error',
  }),
  
  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value) => value.length <= max,
    message: message || `Máximo de ${max} caracteres`,
    type: 'error',
  }),
  
  email: (message = 'Email inválido'): ValidationRule => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
    type: 'error',
  }),
  
  phone: (message = 'Telefone inválido'): ValidationRule => ({
    validate: (value) => /^\+?[\d\s()-]{10,}$/.test(value.replace(/\s/g, '')),
    message,
    type: 'error',
  }),
  
  cpf: (message = 'CPF inválido'): ValidationRule => ({
    validate: (value) => {
      const cpf = value.replace(/\D/g, '');
      if (cpf.length !== 11) return false;
      if (/^(\d)\1+$/.test(cpf)) return false;
      // Simplified validation
      return true;
    },
    message,
    type: 'error',
  }),
  
  cnpj: (message = 'CNPJ inválido'): ValidationRule => ({
    validate: (value) => {
      const cnpj = value.replace(/\D/g, '');
      return cnpj.length === 14;
    },
    message,
    type: 'error',
  }),
  
  url: (message = 'URL inválida'): ValidationRule => ({
    validate: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
    type: 'error',
  }),
  
  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value) => regex.test(value),
    message,
    type: 'error',
  }),
  
  match: (getValue: () => string, message = 'Os valores não coincidem'): ValidationRule => ({
    validate: (value) => value === getValue(),
    message,
    type: 'error',
  }),
  
  passwordStrength: (minScore = 3): ValidationRule => ({
    validate: (value) => {
      let score = 0;
      if (value.length >= 8) score++;
      if (/[a-z]/.test(value)) score++;
      if (/[A-Z]/.test(value)) score++;
      if (/[0-9]/.test(value)) score++;
      if (/[^a-zA-Z0-9]/.test(value)) score++;
      return score >= minScore;
    },
    message: 'Senha muito fraca. Use letras, números e símbolos.',
    type: 'error',
  }),
  
  asyncUnique: (
    checkFn: (value: string) => Promise<boolean>,
    message = 'Este valor já está em uso'
  ): ValidationRule => ({
    validate: checkFn,
    message,
    type: 'error',
  }),
};

// ============================================
// Validation Status Icon
// ============================================

function ValidationIcon({ status, className }: { status: ValidationStatus; className?: string }) {
  const icons = {
    idle: null,
    validating: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
    valid: <CheckCircle className="h-4 w-4 text-success" />,
    invalid: <XCircle className="h-4 w-4 text-destructive" />,
    warning: <AlertCircle className="h-4 w-4 text-warning" />,
  };

  return (
    <AnimatePresence mode="wait">
      {icons[status] && (
        <motion.div
          key={status}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className={className}
        >
          {icons[status]}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Validation Message
// ============================================

interface ValidationMessageProps {
  validation: FieldValidation;
  className?: string;
}

export function ValidationMessage({ validation, className }: ValidationMessageProps) {
  if (!validation.message || validation.status === 'idle' || validation.status === 'validating') {
    return null;
  }

  const colorClasses = {
    error: 'text-destructive',
    warning: 'text-warning',
    info: 'text-info',
  };

  return (
    <AnimatePresence>
      <motion.p
        initial={{ opacity: 0, y: -5, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -5, height: 0 }}
        className={cn(
          'text-xs mt-1 flex items-center gap-1',
          colorClasses[validation.type || 'error'],
          className
        )}
      >
        {validation.type === 'warning' && <AlertCircle className="h-3 w-3" />}
        {validation.type === 'info' && <Info className="h-3 w-3" />}
        {validation.message}
      </motion.p>
    </AnimatePresence>
  );
}

// ============================================
// Validated Input Hook
// ============================================

export function useFieldValidation(
  rules: ValidationRule[],
  debounceMs = 300
) {
  const [value, setValue] = useState('');
  const [validation, setValidation] = useState<FieldValidation>({ status: 'idle' });
  const [touched, setTouched] = useState(false);

  const validate = useCallback(async (val: string) => {
    if (!touched && val === '') {
      setValidation({ status: 'idle' });
      return;
    }

    setValidation({ status: 'validating' });

    for (const rule of rules) {
      try {
        const isValid = await rule.validate(val);
        if (!isValid) {
          setValidation({
            status: rule.type === 'warning' ? 'warning' : 'invalid',
            message: rule.message,
            type: rule.type || 'error',
          });
          return;
        }
      } catch {
        setValidation({
          status: 'invalid',
          message: 'Erro ao validar',
          type: 'error',
        });
        return;
      }
    }

    setValidation({ status: 'valid' });
  }, [rules, touched]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (touched || value !== '') {
        validate(value);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, validate, debounceMs, touched]);

  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
  }, []);

  const handleBlur = useCallback(() => {
    setTouched(true);
    validate(value);
  }, [validate, value]);

  const reset = useCallback(() => {
    setValue('');
    setValidation({ status: 'idle' });
    setTouched(false);
  }, []);

  return {
    value,
    validation,
    touched,
    setValue: handleChange,
    onBlur: handleBlur,
    reset,
    isValid: validation.status === 'valid',
    isInvalid: validation.status === 'invalid',
  };
}

// ============================================
// Validated Input Component
// ============================================

interface ValidatedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  rules?: ValidationRule[];
  value: string;
  onChange: (value: string) => void;
  validation?: FieldValidation;
  onValidationChange?: (validation: FieldValidation) => void;
  showSuccessState?: boolean;
  hint?: string;
}

export function ValidatedInput({
  label,
  rules = [],
  value,
  onChange,
  validation: externalValidation,
  onValidationChange,
  showSuccessState = true,
  hint,
  className,
  ...props
}: ValidatedInputProps) {
  const [internalValidation, setInternalValidation] = useState<FieldValidation>({ status: 'idle' });
  const [touched, setTouched] = useState(false);

  const validation = externalValidation || internalValidation;
  const setValidation = onValidationChange || setInternalValidation;

  const validate = useCallback(async (val: string) => {
    if (!touched && val === '') {
      setValidation({ status: 'idle' });
      return;
    }

    setValidation({ status: 'validating' });

    for (const rule of rules) {
      const isValid = await rule.validate(val);
      if (!isValid) {
        setValidation({
          status: rule.type === 'warning' ? 'warning' : 'invalid',
          message: rule.message,
          type: rule.type || 'error',
        });
        return;
      }
    }

    setValidation({ status: 'valid' });
  }, [rules, touched, setValidation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (touched || value !== '') {
        validate(value);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [value, validate, touched]);

  const borderClasses = {
    idle: '',
    validating: 'border-muted-foreground',
    valid: showSuccessState ? 'border-success focus:ring-success' : '',
    invalid: 'border-destructive focus:ring-destructive',
    warning: 'border-warning focus:ring-warning',
  };

  return (
    <div className="space-y-1">
      {label && (
        <Label className="flex items-center gap-2">
          {label}
          <ValidationIcon status={validation.status} />
        </Label>
      )}
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            setTouched(true);
            validate(value);
          }}
          className={cn(
            borderClasses[validation.status],
            'pr-8',
            className
          )}
          {...props}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <ValidationIcon status={validation.status} />
        </div>
      </div>
      {hint && validation.status === 'idle' && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      <ValidationMessage validation={validation} />
    </div>
  );
}

// ============================================
// Password Strength Meter
// ============================================

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  const getStrength = (pwd: string) => {
    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      lowercase: /[a-z]/.test(pwd),
      uppercase: /[A-Z]/.test(pwd),
      numbers: /[0-9]/.test(pwd),
      symbols: /[^a-zA-Z0-9]/.test(pwd),
    };
    
    score = Object.values(checks).filter(Boolean).length;
    
    return {
      score,
      checks,
      label: ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Excelente'][Math.min(score, 4)],
      color: ['bg-destructive', 'bg-destructive', 'bg-warning', 'bg-success', 'bg-success'][Math.min(score, 4)],
    };
  };

  const strength = getStrength(password);

  if (!password) return null;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full',
              i < strength.score ? strength.color : 'bg-muted'
            )}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: i * 0.05 }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs">
        <span className={cn(
          strength.score < 3 ? 'text-destructive' : 'text-success'
        )}>
          {strength.label}
        </span>
        <div className="flex gap-2 text-muted-foreground">
          {strength.checks.length && <span>8+ chars</span>}
          {strength.checks.uppercase && <span>A-Z</span>}
          {strength.checks.lowercase && <span>a-z</span>}
          {strength.checks.numbers && <span>0-9</span>}
          {strength.checks.symbols && <span>!@#</span>}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Form Validation Context
// ============================================

interface FormValidationState {
  fields: Record<string, FieldValidation>;
  isValid: boolean;
  isValidating: boolean;
}

export function useFormValidation(fieldNames: string[]) {
  const [fields, setFields] = useState<Record<string, FieldValidation>>(
    fieldNames.reduce((acc, name) => ({ ...acc, [name]: { status: 'idle' } }), {})
  );

  const setFieldValidation = useCallback((name: string, validation: FieldValidation) => {
    setFields(prev => ({ ...prev, [name]: validation }));
  }, []);

  const isValid = Object.values(fields).every(f => f.status === 'valid');
  const isValidating = Object.values(fields).some(f => f.status === 'validating');
  const hasErrors = Object.values(fields).some(f => f.status === 'invalid');

  const reset = useCallback(() => {
    setFields(fieldNames.reduce((acc, name) => ({ ...acc, [name]: { status: 'idle' } }), {}));
  }, [fieldNames]);

  return {
    fields,
    setFieldValidation,
    isValid,
    isValidating,
    hasErrors,
    reset,
  };
}

export default ValidatedInput;

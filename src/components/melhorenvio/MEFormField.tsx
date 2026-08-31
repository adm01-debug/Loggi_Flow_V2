import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface MEFormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children?: React.ReactNode;
  // Input props when not using children
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}

export function MEFormField({
  label,
  required,
  error,
  className,
  children,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled,
  maxLength,
}: MEFormFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <Label className={cn('text-sm', error && 'text-destructive')}>
        {label}{required && ' *'}
      </Label>
      {children || (
        <Input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={cn(error && 'border-destructive focus-visible:ring-destructive')}
        />
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

import React, { forwardRef } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { formatCNPJ, formatPhone, formatCEP, formatCPFCNPJ } from '@/lib/validations';

interface MaskedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  maskType: 'cnpj' | 'cpf-cnpj' | 'phone' | 'cep';
  error?: boolean;
}

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ maskType, onChange, className, error, ...props }, ref) => {
    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      
      switch (maskType) {
        case 'cnpj':
          value = formatCNPJ(value);
          break;
        case 'cpf-cnpj':
          value = formatCPFCNPJ(value);
          break;
        case 'phone':
          value = formatPhone(value);
          break;
        case 'cep':
          value = formatCEP(value);
          break;
      }
      
      // Update the event value to be formatted
      e.target.value = value;
      if (onChange) onChange(e);
    };

    return (
      <Input
        {...props}
        ref={ref}
        onChange={handleInput}
        className={cn(
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
      />
    );
  }
);

MaskedInput.displayName = 'MaskedInput';

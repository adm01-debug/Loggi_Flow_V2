import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { formatCEP } from '@/lib/validations';

interface MECepAutoFillProps {
  value: string;
  onChange: (cep: string) => void;
  onAddressFound?: (address: { rua?: string; bairro?: string; cidade?: string; uf?: string }) => void;
  label?: string;
  disabled?: boolean;
}

export function MECepAutoFill({ value, onChange, onAddressFound, label = 'CEP', disabled }: MECepAutoFillProps) {
  const [loading, setLoading] = useState(false);

  const handleChange = (raw: string) => {
    onChange(formatCEP(raw));
  };

  const handleSearch = async () => {
    const clean = value.replace(/\D/g, '');
    if (clean.length !== 8) return;
    setLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro && onAddressFound) {
        onAddressFound({
          rua: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf,
        });
      }
    } catch {
      // silent
    }
    setLoading(false);
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <label className="text-sm font-medium">{label}</label>
        <Input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="00000-000"
          maxLength={9}
          disabled={disabled}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>
      {onAddressFound && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleSearch}
          disabled={loading || value.replace(/\D/g, '').length !== 8 || disabled}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRodonavesTracking } from '@/hooks/useRodonavesTracking';
import { Search, Loader2, MapPin } from 'lucide-react';

interface RTECepAutoFillProps {
  onAddressFound: (address: { rua?: string; bairro?: string; cidade?: string; uf?: string; cep: string }) => void;
  label?: string;
}

export function RTECepAutoFill({ onAddressFound, label = 'CEP' }: RTECepAutoFillProps) {
  const rte = useRodonavesTracking();
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    setLoading(true);
    try {
      // Use ViaCEP as primary (no async variant on RTE mutation)
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        onAddressFound({
          rua: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf,
          cep: cleanCep,
        });
        // Also trigger RTE lookup in background for enrichment
        rte.getAddressByZipCode({ zipCode: cleanCep });
      }
    } catch {
      // Fallback to ViaCEP
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          onAddressFound({
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            uf: data.uf,
            cep: cleanCep,
          });
        }
      } catch { /* silent */ }
    }
    setLoading(false);
  };

  const formatCep = (value: string) => {
    const clean = value.replace(/\D/g, '').slice(0, 8);
    if (clean.length > 5) return `${clean.slice(0, 5)}-${clean.slice(5)}`;
    return clean;
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <label className="text-sm font-medium">{label}</label>
        <Input
          value={cep}
          onChange={(e) => setCep(formatCep(e.target.value))}
          placeholder="00000-000"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>
      <Button variant="outline" size="icon" onClick={handleSearch} disabled={loading || cep.replace(/\D/g, '').length !== 8}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
      </Button>
    </div>
  );
}

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLocalStorage } from "@/hooks/common/useLocalStorage";

const ESTADOS_BRASIL = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export interface QuotationFormData {
  estado_destino: string;
  peso_kg: number;
  volumes: number;
  valor_mercadoria: number;
}

interface QuotationFormProps {
  onSubmit: (data: QuotationFormData) => void;
  isLoading?: boolean;
  compact?: boolean;
}

export function QuotationForm({ onSubmit, isLoading, compact }: QuotationFormProps) {
  const [savedForm, setSavedForm] = useLocalStorage<Partial<QuotationFormData>>('freight-quotation-form', {});
  const [estadoDestino, setEstadoDestino] = useState(savedForm.estado_destino || '');
  const [pesoKg, setPesoKg] = useState(savedForm.peso_kg?.toString() || '');
  const [volumes, setVolumes] = useState(savedForm.volumes?.toString() || '1');
  const [valorMercadoria, setValorMercadoria] = useState(savedForm.valor_mercadoria?.toString() || '');

  const handleSubmit = useCallback(() => {
    if (!estadoDestino || !pesoKg) {
      toast.error('Preencha estado e peso');
      return;
    }
    const data: QuotationFormData = {
      estado_destino: estadoDestino,
      peso_kg: parseFloat(pesoKg),
      volumes: parseInt(volumes) || 1,
      valor_mercadoria: parseFloat(valorMercadoria) || 0,
    };
    setSavedForm(data);
    onSubmit(data);
  }, [estadoDestino, pesoKg, volumes, valorMercadoria, onSubmit, setSavedForm]);

  if (compact) {
    return (
      <div className="flex items-end gap-3">
        <div className="w-24">
          <Label className="text-xs">UF Destino</Label>
          <Select value={estadoDestino} onValueChange={setEstadoDestino}>
            <SelectTrigger className="h-9"><SelectValue placeholder="UF" /></SelectTrigger>
            <SelectContent>{ESTADOS_BRASIL.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="w-24">
          <Label className="text-xs">Peso (kg)</Label>
          <Input className="h-9" type="number" value={pesoKg} onChange={e => setPesoKg(e.target.value)} placeholder="10" />
        </div>
        <Button size="sm" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>
    );
  }

  return (
    <div className="card-base p-4">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <Label>Estado Destino</Label>
          <Select value={estadoDestino} onValueChange={setEstadoDestino}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{ESTADOS_BRASIL.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Peso (kg)</Label>
          <Input type="number" value={pesoKg} onChange={e => setPesoKg(e.target.value)} placeholder="Ex: 10" />
        </div>
        <div>
          <Label>Volumes</Label>
          <Input type="number" value={volumes} onChange={e => setVolumes(e.target.value)} placeholder="1" />
        </div>
        <div>
          <Label>Valor Mercadoria (R$)</Label>
          <Input type="number" value={valorMercadoria} onChange={e => setValorMercadoria(e.target.value)} placeholder="1000" />
        </div>
        <div className="flex items-end">
          <Button onClick={handleSubmit} className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Calcular
          </Button>
        </div>
      </div>
    </div>
  );
}

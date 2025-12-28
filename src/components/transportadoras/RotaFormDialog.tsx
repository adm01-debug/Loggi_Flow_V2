import { useState } from 'react';
import { Plus, Edit, Trash2, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RotaFormData, TransportadoraRota } from '@/hooks/useTransportadoraRotas';

const ESTADOS_BRASIL = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];

interface Transportadora {
  id: string;
  nome_fantasia: string;
}

interface RotaFormDialogProps {
  transportadoras: Transportadora[];
  rota?: TransportadoraRota;
  onSubmit: (data: RotaFormData) => void;
  isLoading?: boolean;
  trigger?: React.ReactNode;
}

export function RotaFormDialog({ 
  transportadoras, 
  rota, 
  onSubmit, 
  isLoading,
  trigger 
}: RotaFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<RotaFormData>({
    transportadora_id: rota?.transportadora_id || '',
    origem_estado: rota?.origem_estado || '',
    origem_cidade: rota?.origem_cidade || undefined,
    origem_cep_inicio: rota?.origem_cep_inicio || undefined,
    origem_cep_fim: rota?.origem_cep_fim || undefined,
    destino_estado: rota?.destino_estado || '',
    destino_cidade: rota?.destino_cidade || undefined,
    destino_cep_inicio: rota?.destino_cep_inicio || undefined,
    destino_cep_fim: rota?.destino_cep_fim || undefined,
    prazo_dias: rota?.prazo_dias || 5,
    preco_por_kg: rota?.preco_por_kg || 0,
    taxa_fixa: rota?.taxa_fixa || 0,
    ativo: rota?.ativo ?? true,
    observacoes: rota?.observacoes || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setOpen(false);
  };

  const isEdit = !!rota;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Rota
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Rota' : 'Nova Rota'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Transportadora */}
          <div className="space-y-2">
            <Label>Transportadora *</Label>
            <Select
              value={formData.transportadora_id}
              onValueChange={(value) => setFormData({ ...formData, transportadora_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a transportadora" />
              </SelectTrigger>
              <SelectContent>
                {transportadoras.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome_fantasia}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Origin section */}
          <div className="space-y-4 p-4 border rounded-lg bg-green-50/50 dark:bg-green-950/20">
            <h3 className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-500" />
              Origem
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado *</Label>
                <Select
                  value={formData.origem_estado}
                  onValueChange={(value) => setFormData({ ...formData, origem_estado: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BRASIL.map((e) => (
                      <SelectItem key={e.sigla} value={e.sigla}>
                        {e.sigla} - {e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={formData.origem_cidade || ''}
                  onChange={(e) => setFormData({ ...formData, origem_cidade: e.target.value || undefined })}
                  placeholder="Ex: Curitiba"
                />
              </div>
              <div className="space-y-2">
                <Label>CEP Início</Label>
                <Input
                  value={formData.origem_cep_inicio || ''}
                  onChange={(e) => setFormData({ ...formData, origem_cep_inicio: e.target.value || undefined })}
                  placeholder="80000-000"
                  maxLength={9}
                />
              </div>
              <div className="space-y-2">
                <Label>CEP Fim</Label>
                <Input
                  value={formData.origem_cep_fim || ''}
                  onChange={(e) => setFormData({ ...formData, origem_cep_fim: e.target.value || undefined })}
                  placeholder="82999-999"
                  maxLength={9}
                />
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          {/* Destination section */}
          <div className="space-y-4 p-4 border rounded-lg bg-red-50/50 dark:bg-red-950/20">
            <h3 className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-500" />
              Destino
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado *</Label>
                <Select
                  value={formData.destino_estado}
                  onValueChange={(value) => setFormData({ ...formData, destino_estado: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BRASIL.map((e) => (
                      <SelectItem key={e.sigla} value={e.sigla}>
                        {e.sigla} - {e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={formData.destino_cidade || ''}
                  onChange={(e) => setFormData({ ...formData, destino_cidade: e.target.value || undefined })}
                  placeholder="Ex: São Paulo"
                />
              </div>
              <div className="space-y-2">
                <Label>CEP Início</Label>
                <Input
                  value={formData.destino_cep_inicio || ''}
                  onChange={(e) => setFormData({ ...formData, destino_cep_inicio: e.target.value || undefined })}
                  placeholder="01000-000"
                  maxLength={9}
                />
              </div>
              <div className="space-y-2">
                <Label>CEP Fim</Label>
                <Input
                  value={formData.destino_cep_fim || ''}
                  onChange={(e) => setFormData({ ...formData, destino_cep_fim: e.target.value || undefined })}
                  placeholder="09999-999"
                  maxLength={9}
                />
              </div>
            </div>
          </div>

          {/* Route details */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Prazo (dias)</Label>
              <Input
                type="number"
                min={1}
                value={formData.prazo_dias || 5}
                onChange={(e) => setFormData({ ...formData, prazo_dias: parseInt(e.target.value) || 5 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Taxa Fixa (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={formData.taxa_fixa || 0}
                onChange={(e) => setFormData({ ...formData, taxa_fixa: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Preço/kg (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min={0}
                value={formData.preco_por_kg || 0}
                onChange={(e) => setFormData({ ...formData, preco_por_kg: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Observations */}
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes || ''}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value || undefined })}
              placeholder="Observações sobre esta rota..."
              rows={2}
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
            />
            <Label>Rota ativa</Label>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isEdit ? 'Salvar' : 'Adicionar Rota'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

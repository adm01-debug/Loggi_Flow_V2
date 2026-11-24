import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Star, Search, Loader2, Truck, Package, AlertTriangle } from 'lucide-react';
import { useRodonavesTracking } from "@/hooks/logistics/useRodonavesTracking";
import { toast } from 'sonner';
import { formatCEP } from '@/lib/validations';
import {
  resolveCubageFactor,
  resolveTaxableWeight,
} from '@/lib/rodonaves/taxableWeight';

export function RodonavesQuotation() {
  const rodonaves = useRodonavesTracking();
  const [form, setForm] = useState({
    cepOrigem: '', cepDestino: '', peso: '', volumes: '1', valorMercadoria: '',
  });

  const updateField = useCallback((field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleQuote = useCallback(() => {
    if (!form.cepOrigem || !form.cepDestino || !form.peso) {
      toast.error('Preencha CEP origem, destino e peso');
      return;
    }
    rodonaves.getQuotation({
      cepOrigem: form.cepOrigem.replace(/\D/g, ''),
      cepDestino: form.cepDestino.replace(/\D/g, ''),
      peso: parseFloat(form.peso),
      volumes: parseInt(form.volumes) || 1,
      valorMercadoria: parseFloat(form.valorMercadoria) || 0,
      cnpjRemetente: '',
    });
  }, [form, rodonaves]);

  const handleDeadline = useCallback(() => {
    if (!form.cepOrigem || !form.cepDestino) {
      toast.error('Preencha os CEPs');
      return;
    }
    rodonaves.getDeadline({
      cepOrigem: form.cepOrigem.replace(/\D/g, ''),
      cepDestino: form.cepDestino.replace(/\D/g, ''),
    });
  }, [form, rodonaves]);

  // Cubagem state managed with React state (not document.getElementById)
  const [cubageCnpj, setCubageCnpj] = useState('');

  const handleCubage = useCallback(() => {
    if (!cubageCnpj) {
      toast.error('Informe o CNPJ');
      return;
    }
    rodonaves.getCubageFactor({ cnpjRemetente: cubageCnpj.replace(/\D/g, '') });
  }, [cubageCnpj, rodonaves]);

  // Dimensões medidas na conferência: o peso cubado define o que a
  // transportadora vai cobrar quando supera o peso declarado.
  const [dims, setDims] = useState({
    lengthCm: '', widthCm: '', heightCm: '', quantity: '1',
  });

  const updateDim = useCallback((field: string, value: string) => {
    setDims(prev => ({ ...prev, [field]: value }));
  }, []);

  const hasDims = Boolean(dims.lengthCm && dims.widthCm && dims.heightCm);
  const factor = resolveCubageFactor(
    rodonaves.cubageResult?.data?.CubingFactor ??
      rodonaves.cubageResult?.data?.cubingFactor,
  );
  const taxable = resolveTaxableWeight(
    parseFloat(form.peso) || 0,
    {
      lengthCm: parseFloat(dims.lengthCm) || 0,
      widthCm: parseFloat(dims.widthCm) || 0,
      heightCm: parseFloat(dims.heightCm) || 0,
      quantity: parseInt(dims.quantity) || 0,
    },
    factor,
  );

  return (
    <div className="space-y-6">
      {/* Cotação Rodonaves */}
      <div className="card-base p-4">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5 text-primary" />
          <span className="font-semibold">Cotação via API Rodonaves</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label>CEP Origem</Label>
            <Input
              value={form.cepOrigem}
              onChange={e => updateField('cepOrigem', formatCEP(e.target.value))}
              placeholder="00000-000"
              maxLength={9}
            />
          </div>
          <div>
            <Label>CEP Destino</Label>
            <Input
              value={form.cepDestino}
              onChange={e => updateField('cepDestino', formatCEP(e.target.value))}
              placeholder="00000-000"
              maxLength={9}
            />
          </div>
          <div>
            <Label>Peso (kg)</Label>
            <Input type="number" value={form.peso} onChange={e => updateField('peso', e.target.value)} placeholder="10" />
          </div>
          <div>
            <Label>Volumes</Label>
            <Input type="number" value={form.volumes} onChange={e => updateField('volumes', e.target.value)} placeholder="1" />
          </div>
          <div>
            <Label>Valor Mercadoria</Label>
            <Input type="number" value={form.valorMercadoria} onChange={e => updateField('valorMercadoria', e.target.value)} placeholder="1000" />
          </div>
        </div>
        <Button className="mt-4" onClick={handleQuote} disabled={rodonaves.isQuoting}>
          {rodonaves.isQuoting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
          Consultar Rodonaves
        </Button>

        {rodonaves.quotationResult?.data && (
          <div className="card-interactive flex items-center gap-4 mt-4">
            <div className="p-3 rounded-lg bg-warning/15"><Star className="w-5 h-5 text-warning" /></div>
            <div className="flex-1">
              <p className="font-semibold">Rodonaves RTE</p>
              <p className="text-sm text-muted-foreground"><Clock className="w-3 h-3 inline mr-1" />{rodonaves.quotationResult.data.PrazoEntrega} dias</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">R$ {rodonaves.quotationResult.data.Valor?.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">
                Frete: R$ {rodonaves.quotationResult.data.ValorFrete?.toFixed(2)} | Pedágio: R$ {rodonaves.quotationResult.data.ValorPedagio?.toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Prazo & Cubagem */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-base p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2"><Clock className="w-5 h-5 text-primary" /><span className="font-semibold">Prazo de Entrega RTE</span></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>CEP Origem</Label>
              <Input value={form.cepOrigem} onChange={e => updateField('cepOrigem', formatCEP(e.target.value))} placeholder="00000-000" maxLength={9} />
            </div>
            <div>
              <Label>CEP Destino</Label>
              <Input value={form.cepDestino} onChange={e => updateField('cepDestino', formatCEP(e.target.value))} placeholder="00000-000" maxLength={9} />
            </div>
          </div>
          <Button className="w-full" size="sm" onClick={handleDeadline} disabled={rodonaves.isLoadingDeadline}>
            {rodonaves.isLoadingDeadline ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}
            Calcular Prazo
          </Button>
          {rodonaves.deadlineResult?.data && (
            <div className="p-3 rounded-lg bg-muted/30 border text-sm space-y-1">
              <div className="text-2xl font-bold text-primary">{rodonaves.deadlineResult.data.Prazo} dias úteis</div>
              {rodonaves.deadlineResult.data.DataPrevistaEntrega && (
                <div className="text-muted-foreground">Previsão: {new Date(rodonaves.deadlineResult.data.DataPrevistaEntrega).toLocaleDateString('pt-BR')}</div>
              )}
            </div>
          )}
        </div>

        <div className="card-base p-4 space-y-4">
          <div className="flex items-center gap-2 mb-2"><Package className="w-5 h-5 text-primary" /><span className="font-semibold">Fator de Cubagem</span></div>
          <div>
            <Label>CNPJ do Cliente</Label>
            <Input
              value={cubageCnpj}
              onChange={e => setCubageCnpj(e.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </div>
          <Button className="w-full" size="sm" onClick={handleCubage}>
            <Search className="w-4 h-4 mr-2" />Consultar Cubagem
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="cub-length">Comprimento (cm)</Label>
              <Input
                id="cub-length"
                inputMode="decimal"
                value={dims.lengthCm}
                onChange={e => updateDim('lengthCm', e.target.value)}
                placeholder="Ex: 120"
              />
            </div>
            <div>
              <Label htmlFor="cub-width">Largura (cm)</Label>
              <Input
                id="cub-width"
                inputMode="decimal"
                value={dims.widthCm}
                onChange={e => updateDim('widthCm', e.target.value)}
                placeholder="Ex: 100"
              />
            </div>
            <div>
              <Label htmlFor="cub-height">Altura (cm)</Label>
              <Input
                id="cub-height"
                inputMode="decimal"
                value={dims.heightCm}
                onChange={e => updateDim('heightCm', e.target.value)}
                placeholder="Ex: 80"
              />
            </div>
            <div>
              <Label htmlFor="cub-qty">Volumes</Label>
              <Input
                id="cub-qty"
                inputMode="numeric"
                value={dims.quantity}
                onChange={e => updateDim('quantity', e.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          {rodonaves.cubageResult?.data && (
            <div className="p-3 rounded-lg bg-muted/30 border text-sm">
              <div className="text-xl font-bold text-primary">
                Fator: {rodonaves.cubageResult.data.CubingFactor || rodonaves.cubageResult.data.cubingFactor || 'N/A'}
              </div>
              <p className="text-muted-foreground mt-1">Use este fator para calcular peso cubado: (C × L × A) ÷ fator</p>
            </div>
          )}

          {hasDims && (
            <div className="p-3 rounded-lg border text-sm space-y-1" data-testid="taxable-weight">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Volume</span>
                <span>{taxable.volumeM3} m³</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Peso cubado</span>
                <span>{taxable.cubicKg} kg</span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span>Peso taxável</span>
                <span className="text-primary">{taxable.taxableKg} kg</span>
              </div>
              {taxable.billedByCubage ? (
                <p className="flex items-start gap-1 text-warning">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  A cubagem supera o peso declarado em {taxable.surchargePercent}%:
                  a cobrança será por {taxable.taxableKg} kg.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Fator {factor} kg/m³
                  {rodonaves.cubageResult?.data ? '' : ' (padrão de mercado — consulte o cliente para confirmar)'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

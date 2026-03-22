import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { SplitSquareVertical, TrendingDown } from 'lucide-react';
import type { QuotationResult } from '@/hooks/useFreightQuotation';
import type { CargoData } from '@/hooks/useQuotationFlow';

interface ScenarioSimulatorProps {
  cargoData: CargoData | null;
  simulateScenario: (data: CargoData, splitVolumes: number) => Array<{ volumes: number; results: QuotationResult[] }>;
}

export function ScenarioSimulator({ cargoData, simulateScenario }: ScenarioSimulatorProps) {
  const [splits, setSplits] = useState(2);

  const scenarios = useMemo(() => {
    if (!cargoData) return [];
    return simulateScenario(cargoData, splits);
  }, [cargoData, splits, simulateScenario]);

  if (!cargoData) {
    return (
      <div className="card-base p-4 text-center text-muted-foreground text-sm">
        <SplitSquareVertical className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
        Faça uma cotação primeiro para simular cenários
      </div>
    );
  }

  const bestPerScenario = scenarios.map(s => ({
    volumes: s.volumes,
    best: s.results[0],
    total: s.results[0] ? s.results[0].valor_total * (s.volumes > 1 ? 1 : 1) : 0,
  }));

  return (
    <div className="card-base p-4 space-y-4">
      <div className="flex items-center gap-2">
        <SplitSquareVertical className="w-5 h-5 text-primary" />
        <span className="font-semibold">Simulação de Cenários</span>
      </div>

      <div>
        <Label>Dividir em até {splits} volumes</Label>
        <Slider value={[splits]} onValueChange={v => setSplits(v[0])} min={2} max={5} step={1} className="mt-2" />
      </div>

      <div className="space-y-2">
        {bestPerScenario.filter(s => s.best).map(s => (
          <div key={s.volumes} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
            <div>
              <p className="font-medium text-sm">{s.volumes === 1 ? 'Envio único' : `${s.volumes} volumes`}</p>
              <p className="text-xs text-muted-foreground">{s.best.transportadora_nome} · {s.best.prazo_dias} dias</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">R$ {s.best.valor_total.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      {bestPerScenario.length >= 2 && bestPerScenario[0]?.best && bestPerScenario[bestPerScenario.length - 1]?.best && (
        <div className="flex items-center gap-2 text-sm text-success">
          <TrendingDown className="w-4 h-4" />
          Compare os cenários para encontrar a melhor opção de envio
        </div>
      )}
    </div>
  );
}

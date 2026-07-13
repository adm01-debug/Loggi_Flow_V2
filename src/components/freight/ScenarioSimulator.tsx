import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SplitSquareVertical, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

interface SimulationResult {
  volumes: number;
  results: {
    transportadora_nome: string;
    valor_total: number;
    [key: string]: unknown;
  }[];
}

interface ScenarioSimulatorProps<TCargo = unknown> {
  cargoData: TCargo | null;
  simulateScenario: (data: TCargo, splitVolumes: number) => Promise<SimulationResult[]>;
}

export function ScenarioSimulator({ cargoData, simulateScenario }: ScenarioSimulatorProps) {
  const [volumes, setVolumes] = useState(2);
  const [results, setResults] = useState<SimulationResult[]>([]);

  const handleSimulate = async () => {
    if (!cargoData) return;
    const scenarios = await simulateScenario(cargoData, volumes);
    setResults(scenarios);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SplitSquareVertical className="w-5 h-5 text-primary" />
            Simulador de Fracionamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="volumes">Número de Volumes para Fracionar</Label>
              <Input
                id="volumes"
                type="number"
                value={volumes}
                onChange={(e) => setVolumes(Number(e.target.value))}
                min={2}
                max={10}
              />
            </div>
            <Button onClick={handleSimulate} disabled={!cargoData} className="w-full sm:w-auto">
              Simular Impacto
            </Button>
          </div>
          {!cargoData && (
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
              Preencha os dados da carga na aba Cotação primeiro.
            </p>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((res, idx) => (
            <Card key={idx} className="border-primary/20">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <Badge variant="outline">Volume {res.volumes}</Badge>
                  <Package className="w-4 h-4 text-primary" />
                </div>
                <div className="space-y-2">
                  {res.results.slice(0, 2).map((r, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate">{r.transportadora_nome}</span>
                      <span className="font-bold">{formatCurrency(r.valor_total)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

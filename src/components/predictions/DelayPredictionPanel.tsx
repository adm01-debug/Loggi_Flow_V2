import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Truck, 
  Package,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Zap
} from 'lucide-react';
import { useDelayPrediction, DelayPrediction } from '@/hooks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function DelayPredictionPanel() {
  const { 
    isLoading, 
    predictions, 
    summary, 
    lastAnalyzed, 
    analyzeDelays,
    getRiskColor,
    getRiskLabel,
    isCached
  } = useDelayPrediction();
  
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // Tenta carregar predições em cache ao montar o componente
    if (predictions.length === 0) {
      analyzeDelays(false);
    }
  }, [analyzeDelays, predictions.length]);

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Previsão de Atrasos com IA</CardTitle>
          </div>
          <Button 
            onClick={() => analyzeDelays(true)} 
            disabled={isLoading}
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Analisando...' : 'Analisar Agora'}
          </Button>
        </div>
        <CardDescription>
          Análise preditiva baseada em IA para identificar entregas e coletas com risco de atraso
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{summary.total_analisados}</div>
              <div className="text-xs text-muted-foreground">Analisados</div>
            </div>
            <div className="bg-destructive/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-destructive">{summary.criticos}</div>
              <div className="text-xs text-destructive">Críticos</div>
            </div>
            <div className="bg-warning/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-warning">{summary.altos}</div>
              <div className="text-xs text-warning">Alto Risco</div>
            </div>
            <div className="bg-accent/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-accent-foreground">{summary.medios}</div>
              <div className="text-xs text-accent-foreground">Médio Risco</div>
            </div>
            <div className="bg-success/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-success">{summary.baixos}</div>
              <div className="text-xs text-success">Baixo Risco</div>
            </div>
          </div>
        )}

        {/* Last analyzed timestamp */}
        {lastAnalyzed && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Última análise: {format(new Date(lastAnalyzed), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </div>
            {isCached && (
              <Badge variant="outline" className="text-[10px] h-5 gap-1 font-normal bg-primary/5 text-primary border-primary/20">
                <Zap className="h-2.5 w-2.5" />
                Cacheado
              </Badge>
            )}
          </div>
        )}

        <Separator />

        {/* Predictions List */}
        {predictions.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {predictions.map((prediction) => (
                <PredictionCard
                  key={prediction.id}
                  prediction={prediction}
                  isExpanded={expandedId === prediction.id}
                  onToggle={() => toggleExpanded(prediction.id)}
                  getRiskColor={getRiskColor}
                  getRiskLabel={getRiskLabel}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Clique em "Analisar Agora" para iniciar a previsão de atrasos</p>
            <p className="text-xs mt-1">A IA analisará todas as entregas e coletas em andamento</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PredictionCardProps {
  prediction: DelayPrediction;
  isExpanded: boolean;
  onToggle: () => void;
  getRiskColor: (risco: DelayPrediction['risco']) => string;
  getRiskLabel: (risco: DelayPrediction['risco']) => string;
}

function PredictionCard({ prediction, isExpanded, onToggle, getRiskColor, getRiskLabel }: PredictionCardProps) {
  const Icon = prediction.tipo === 'entrega' ? Truck : Package;
  
  return (
    <div 
      className={`border rounded-lg p-3 transition-all ${
        prediction.risco === 'critico' ? 'border-destructive/30 bg-destructive/5' :
        prediction.risco === 'alto' ? 'border-warning/30 bg-warning/5' :
        'border-border'
      }`}
    >
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="font-medium">{prediction.numero}</div>
            <div className="text-xs text-muted-foreground capitalize">{prediction.tipo}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className={getRiskColor(prediction.risco)}>
            {getRiskLabel(prediction.risco)}
          </Badge>
          <div className="text-right">
            <div className="text-sm font-semibold">{prediction.probabilidade_atraso}%</div>
            <div className="text-xs text-muted-foreground">prob. atraso</div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-3 border-t pt-3">
          {/* Estimated delay */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Atraso estimado: <strong>{prediction.horas_estimadas_atraso}h</strong></span>
          </div>

          {/* Reasons */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Motivos identificados:
            </div>
            <ul className="text-sm text-muted-foreground pl-6 space-y-1">
              {prediction.motivos.map((motivo, i) => (
                <li key={i} className="list-disc">{motivo}</li>
              ))}
            </ul>
          </div>

          {/* Recommendations */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Recomendações:
            </div>
            <ul className="text-sm text-muted-foreground pl-6 space-y-1">
              {prediction.recomendacoes.map((rec, i) => (
                <li key={i} className="list-disc">{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

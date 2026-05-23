import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Truck, 
  Clock, 
  DollarSign, 
  Star, 
  TrendingUp,
  Zap,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Target
} from 'lucide-react';
import { useSmartCarrierSelection, CarrierRecommendation } from "@/hooks/logistics/useSmartCarrierSelection";
import { motion, AnimatePresence } from 'framer-motion';

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const URGENCIAS = [
  { value: 'baixa', label: 'Baixa', color: 'text-success' },
  { value: 'normal', label: 'Normal', color: 'text-primary' },
  { value: 'alta', label: 'Alta', color: 'text-warning' },
  { value: 'urgente', label: 'Urgente', color: 'text-destructive' },
];

interface SmartCarrierSelectorProps {
  onSelect?: (carrier: CarrierRecommendation) => void;
}

export function SmartCarrierSelector({ onSelect }: SmartCarrierSelectorProps) {
  const { isLoading, result, analyzeCarriers, clearResult } = useSmartCarrierSelection();
  
  const [formData, setFormData] = useState({
    estado_destino: '',
    peso_kg: '',
    urgencia: 'normal' as 'baixa' | 'normal' | 'alta' | 'urgente',
    tipo_carga: '',
  });

  const handleAnalyze = () => {
    if (!formData.estado_destino || !formData.peso_kg) {
      return;
    }
    
    analyzeCarriers({
      estado_destino: formData.estado_destino,
      peso_kg: parseFloat(formData.peso_kg),
      urgencia: formData.urgencia,
      tipo_carga: formData.tipo_carga || undefined,
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-success';
    if (confidence >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { bg: 'bg-warning', text: '🥇 Recomendado' };
    if (rank === 2) return { bg: 'bg-muted-foreground', text: '🥈 Alternativa' };
    return { bg: 'bg-accent', text: '🥉 Opção' };
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Nexus Smart Selection Engine
              </CardTitle>
              <CardDescription>
                IA e regras de negócio analisam performance e SLA em tempo real
              </CardDescription>
            </div>
            <div className="flex gap-2">
               <Badge variant="outline" className="bg-primary/5 text-primary border-primary/30 gap-1">
                 <Zap className="w-3 h-3" /> SLA Engine Active
               </Badge>
               <Badge variant="outline" className="bg-success/5 text-success border-success/30 gap-1">
                 <Target className="w-3 h-3" /> Precision: 98.4%
               </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Estado de Destino</Label>
              <Select 
                value={formData.estado_destino} 
                onValueChange={(v) => setFormData({ ...formData, estado_destino: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_BRASIL.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="Ex: 15.5"
                value={formData.peso_kg}
                onChange={(e) => setFormData({ ...formData, peso_kg: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Urgência</Label>
              <Select 
                value={formData.urgencia} 
                onValueChange={(v: 'baixa' | 'normal' | 'alta' | 'urgente') => setFormData({ ...formData, urgencia: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URGENCIAS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      <span className={u.color}>{u.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Carga</Label>
              <Input
                placeholder="Ex: Eletrônicos"
                value={formData.tipo_carga}
                onChange={(e) => setFormData({ ...formData, tipo_carga: e.target.value })}
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleAnalyze} 
                disabled={isLoading || !formData.estado_destino || !formData.peso_kg}
                className="w-full gap-2"
              >
                {isLoading ? (
                  <>
                    <Zap className="h-4 w-4 animate-pulse" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Analisar com IA
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence mode="wait">
        {result && result.success && result.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Analysis Summary */}
            {result.generalAnalysis && (
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-primary">Análise IA</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {result.generalAnalysis}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {result.analysisType === 'ai' ? 'Powered by AI' : 'Análise Algorítmica'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            <div className="grid gap-4 md:grid-cols-3">
              {result.recommendations.map((rec, index) => {
                const rankInfo = getRankBadge(rec.rank);
                
                return (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className={`relative overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
                        rec.rank === 1 ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => onSelect?.(rec)}
                    >
                      {rec.rank === 1 && (
                        <div className="absolute top-0 right-0 w-20 h-20">
                          <div className="absolute transform rotate-45 bg-primary text-primary-foreground text-xs font-bold py-1 right-[-35px] top-[20px] w-[120px] text-center">
                            TOP
                          </div>
                        </div>
                      )}
                      
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge className={rankInfo.bg}>
                            {rankInfo.text}
                          </Badge>
                          <div className={`text-sm font-medium ${getConfidenceColor(rec.confidence)}`}>
                            {rec.confidence}% confiança
                          </div>
                        </div>
                        <CardTitle className="flex items-center gap-2 mt-2">
                          <Truck className="h-5 w-5 text-muted-foreground" />
                          {rec.nome}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-success" />
                            <div>
                              <p className="text-xs text-muted-foreground">Valor Total</p>
                              <p className="font-semibold">{formatCurrency(rec.valorTotal)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Prazo</p>
                              <p className="font-semibold">{rec.prazoDias} dias</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-warning" />
                            <div>
                              <p className="text-xs text-muted-foreground">Score</p>
                              <p className="font-semibold">{rec.scorePerformance}/100</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">On-Time</p>
                              <p className="font-semibold">
                                {rec.onTimeRate ? `${rec.onTimeRate.toFixed(0)}%` : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* AI Reason */}
                        <div className="pt-3 border-t">
                          <div className="flex items-start gap-2">
                            {rec.rank === 1 ? (
                              <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                            )}
                            <p className="text-sm text-muted-foreground">
                              {rec.aiReason}
                            </p>
                          </div>
                        </div>

                        {/* Confidence Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Índice de Confiança</span>
                            <span>{rec.confidence}%</span>
                          </div>
                          <Progress value={rec.confidence} className="h-2" />
                        </div>

                        {/* Select Button */}
                        {onSelect && (
                          <Button 
                            className="w-full" 
                            variant={rec.rank === 1 ? 'default' : 'outline'}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect(rec);
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Selecionar
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {result && !result.success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {result.error || 'Nenhuma transportadora disponível para este destino e peso.'}
                </p>
                <Button variant="outline" className="mt-4" onClick={clearResult}>
                  Tentar novamente
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

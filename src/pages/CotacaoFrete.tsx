import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  TrendingUp, 
  Clock, 
  Award,
  Plus,
  Trash2,
  Search,
  Package,
  MapPin,
  DollarSign,
  Star,
  Brain
} from 'lucide-react';
import { useFreightQuotation, QuotationResult } from '@/hooks/useFreightQuotation';
import { SmartCarrierSelector } from '@/components/freight/SmartCarrierSelector';
import { toast } from 'sonner';

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const REGIOES_BRASIL = [
  'Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul'
];

export default function CotacaoFrete() {
  const {
    tabelasFrete,
    transportadoras,
    isLoadingTabelas,
    availableStates,
    calculateQuotations,
    addTabelaFrete,
    deleteTabelaFrete,
  } = useFreightQuotation();

  // Quotation form state
  const [estadoDestino, setEstadoDestino] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [quotationResults, setQuotationResults] = useState<QuotationResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // New table form state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTableForm, setNewTableForm] = useState({
    transportadora_id: '',
    regiao_destino: '',
    estado_destino: '',
    peso_min_kg: '0',
    peso_max_kg: '50',
    preco_por_kg: '',
    taxa_fixa: '0',
    prazo_dias: '5',
  });

  const handleCalculateQuotation = () => {
    if (!estadoDestino || !pesoKg) {
      toast.error('Preencha o estado de destino e o peso');
      return;
    }

    const peso = parseFloat(pesoKg);
    if (isNaN(peso) || peso <= 0) {
      toast.error('Peso inválido');
      return;
    }

    const results = calculateQuotations({
      estado_destino: estadoDestino,
      peso_kg: peso,
    });

    setQuotationResults(results);
    setHasSearched(true);

    if (results.length === 0) {
      toast.info('Nenhuma transportadora encontrada para este destino e peso');
    } else {
      toast.success(`${results.length} cotação(ões) encontrada(s)`);
    }
  };

  const handleAddTable = async () => {
    if (!newTableForm.transportadora_id || !newTableForm.estado_destino || !newTableForm.preco_por_kg) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    await addTabelaFrete.mutateAsync({
      transportadora_id: newTableForm.transportadora_id,
      regiao_destino: newTableForm.regiao_destino,
      estado_destino: newTableForm.estado_destino,
      peso_min_kg: parseFloat(newTableForm.peso_min_kg),
      peso_max_kg: parseFloat(newTableForm.peso_max_kg),
      preco_por_kg: parseFloat(newTableForm.preco_por_kg),
      taxa_fixa: parseFloat(newTableForm.taxa_fixa),
      prazo_dias: parseInt(newTableForm.prazo_dias),
      ativo: true,
    });

    setIsAddDialogOpen(false);
    setNewTableForm({
      transportadora_id: '',
      regiao_destino: '',
      estado_destino: '',
      peso_min_kg: '0',
      peso_max_kg: '50',
      preco_por_kg: '',
      taxa_fixa: '0',
      prazo_dias: '5',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Cotação de Frete
            </h1>
            <p className="text-muted-foreground">
              Compare preços e prazos entre transportadoras cadastradas
            </p>
          </div>
        </div>

        <Tabs defaultValue="cotacao" className="space-y-6">
          <TabsList>
            <TabsTrigger value="cotacao" className="gap-2">
              <Calculator className="h-4 w-4" />
              Calculadora
            </TabsTrigger>
            <TabsTrigger value="inteligente" className="gap-2">
              <Brain className="h-4 w-4" />
              Seleção IA
            </TabsTrigger>
            <TabsTrigger value="tabelas" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Tabelas de Preço
            </TabsTrigger>
          </TabsList>

          {/* Quotation Calculator Tab */}
          <TabsContent value="cotacao" className="space-y-6">
            {/* Quotation Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Calcular Cotação
                </CardTitle>
                <CardDescription>
                  Informe o destino e peso para comparar as transportadoras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado de Destino</Label>
                    <Select value={estadoDestino} onValueChange={setEstadoDestino}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStates.length > 0 ? (
                          availableStates.map((estado) => (
                            <SelectItem key={estado} value={estado}>
                              {estado}
                            </SelectItem>
                          ))
                        ) : (
                          ESTADOS_BRASIL.map((estado) => (
                            <SelectItem key={estado} value={estado}>
                              {estado}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="peso">Peso (kg)</Label>
                    <Input
                      id="peso"
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="Ex: 15.5"
                      value={pesoKg}
                      onChange={(e) => setPesoKg(e.target.value)}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button onClick={handleCalculateQuotation} className="w-full gap-2">
                      <Calculator className="h-4 w-4" />
                      Calcular
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {hasSearched && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Resultados da Cotação
                  </CardTitle>
                  <CardDescription>
                    {quotationResults.length > 0
                      ? `${quotationResults.length} transportadora(s) encontrada(s) para ${estadoDestino} - ${pesoKg}kg`
                      : 'Nenhuma transportadora disponível para este destino e peso'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {quotationResults.length > 0 ? (
                    <div className="space-y-4">
                      {/* Best Options Summary */}
                      <div className="grid gap-4 md:grid-cols-3">
                        {quotationResults.find((q) => q.melhor_preco) && (
                          <Card className="border-green-500/50 bg-green-500/5">
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2 text-green-600">
                                <DollarSign className="h-5 w-5" />
                                <span className="font-semibold">Melhor Preço</span>
                              </div>
                              <p className="mt-2 text-2xl font-bold text-foreground">
                                {formatCurrency(quotationResults.find((q) => q.melhor_preco)!.valor_total)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {quotationResults.find((q) => q.melhor_preco)!.transportadora_nome}
                              </p>
                            </CardContent>
                          </Card>
                        )}

                        {quotationResults.find((q) => q.melhor_prazo) && (
                          <Card className="border-blue-500/50 bg-blue-500/5">
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2 text-blue-600">
                                <Clock className="h-5 w-5" />
                                <span className="font-semibold">Menor Prazo</span>
                              </div>
                              <p className="mt-2 text-2xl font-bold text-foreground">
                                {quotationResults.find((q) => q.melhor_prazo)!.prazo_dias} dias
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {quotationResults.find((q) => q.melhor_prazo)!.transportadora_nome}
                              </p>
                            </CardContent>
                          </Card>
                        )}

                        {quotationResults.find((q) => q.melhor_custo_beneficio) && (
                          <Card className="border-amber-500/50 bg-amber-500/5">
                            <CardContent className="pt-4">
                              <div className="flex items-center gap-2 text-amber-600">
                                <Award className="h-5 w-5" />
                                <span className="font-semibold">Melhor Custo-Benefício</span>
                              </div>
                              <p className="mt-2 text-2xl font-bold text-foreground">
                                {formatCurrency(quotationResults.find((q) => q.melhor_custo_beneficio)!.valor_total)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {quotationResults.find((q) => q.melhor_custo_beneficio)!.transportadora_nome}
                              </p>
                            </CardContent>
                          </Card>
                        )}
                      </div>

                      {/* Full Results Table */}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Transportadora</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Prazo</TableHead>
                            <TableHead>Taxa Fixa</TableHead>
                            <TableHead>R$/kg</TableHead>
                            <TableHead>Valor Total</TableHead>
                            <TableHead>Destaques</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quotationResults.map((result, index) => (
                            <TableRow key={result.transportadora_id + index}>
                              <TableCell className="font-medium">
                                {result.transportadora_nome}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-amber-500" />
                                  <span>{result.score_performance}</span>
                                </div>
                              </TableCell>
                              <TableCell>{result.prazo_dias} dias</TableCell>
                              <TableCell>{formatCurrency(result.taxa_fixa)}</TableCell>
                              <TableCell>{formatCurrency(result.preco_por_kg)}</TableCell>
                              <TableCell className="font-semibold">
                                {formatCurrency(result.valor_total)}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {result.melhor_preco && (
                                    <Badge variant="secondary" className="bg-green-500/20 text-green-600">
                                      Menor Preço
                                    </Badge>
                                  )}
                                  {result.melhor_prazo && (
                                    <Badge variant="secondary" className="bg-blue-500/20 text-blue-600">
                                      Menor Prazo
                                    </Badge>
                                  )}
                                  {result.melhor_custo_beneficio && (
                                    <Badge variant="secondary" className="bg-amber-500/20 text-amber-600">
                                      Recomendado
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Package className="h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 text-muted-foreground">
                        Nenhuma transportadora encontrada para este destino e peso.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Cadastre tabelas de frete na aba "Tabelas de Preço".
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Freight Tables Tab */}
          <TabsContent value="tabelas" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Tabelas de Frete
                  </CardTitle>
                  <CardDescription>
                    Gerencie as tabelas de preços por transportadora e região
                  </CardDescription>
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Nova Tabela
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Tabela de Frete</DialogTitle>
                      <DialogDescription>
                        Configure os preços e prazos para uma transportadora
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Transportadora</Label>
                        <Select
                          value={newTableForm.transportadora_id}
                          onValueChange={(value) =>
                            setNewTableForm({ ...newTableForm, transportadora_id: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a transportadora" />
                          </SelectTrigger>
                          <SelectContent>
                            {transportadoras?.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.nome_fantasia}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Região</Label>
                          <Select
                            value={newTableForm.regiao_destino}
                            onValueChange={(value) =>
                              setNewTableForm({ ...newTableForm, regiao_destino: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Região" />
                            </SelectTrigger>
                            <SelectContent>
                              {REGIOES_BRASIL.map((regiao) => (
                                <SelectItem key={regiao} value={regiao}>
                                  {regiao}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Estado</Label>
                          <Select
                            value={newTableForm.estado_destino}
                            onValueChange={(value) =>
                              setNewTableForm({ ...newTableForm, estado_destino: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="UF" />
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
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Peso Mínimo (kg)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={newTableForm.peso_min_kg}
                            onChange={(e) =>
                              setNewTableForm({ ...newTableForm, peso_min_kg: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Peso Máximo (kg)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={newTableForm.peso_max_kg}
                            onChange={(e) =>
                              setNewTableForm({ ...newTableForm, peso_max_kg: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Preço/kg (R$)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="5.50"
                            value={newTableForm.preco_por_kg}
                            onChange={(e) =>
                              setNewTableForm({ ...newTableForm, preco_por_kg: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Taxa Fixa (R$)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={newTableForm.taxa_fixa}
                            onChange={(e) =>
                              setNewTableForm({ ...newTableForm, taxa_fixa: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Prazo (dias)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={newTableForm.prazo_dias}
                            onChange={(e) =>
                              setNewTableForm({ ...newTableForm, prazo_dias: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddTable} disabled={addTabelaFrete.isPending}>
                        {addTabelaFrete.isPending ? 'Salvando...' : 'Salvar'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {isLoadingTabelas ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : tabelasFrete && tabelasFrete.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transportadora</TableHead>
                        <TableHead>Região</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Faixa de Peso</TableHead>
                        <TableHead>R$/kg</TableHead>
                        <TableHead>Taxa Fixa</TableHead>
                        <TableHead>Prazo</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tabelasFrete.map((tabela) => (
                        <TableRow key={tabela.id}>
                          <TableCell className="font-medium">
                            {tabela.transportadora?.nome_fantasia || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              <MapPin className="mr-1 h-3 w-3" />
                              {tabela.regiao_destino}
                            </Badge>
                          </TableCell>
                          <TableCell>{tabela.estado_destino}</TableCell>
                          <TableCell>
                            {tabela.peso_min_kg}kg - {tabela.peso_max_kg}kg
                          </TableCell>
                          <TableCell>{formatCurrency(tabela.preco_por_kg)}</TableCell>
                          <TableCell>{formatCurrency(tabela.taxa_fixa)}</TableCell>
                          <TableCell>{tabela.prazo_dias} dias</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteTabelaFrete.mutate(tabela.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <DollarSign className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">
                      Nenhuma tabela de frete cadastrada.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4 gap-2"
                      onClick={() => setIsAddDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar primeira tabela
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Smart Carrier Selection Tab */}
          <TabsContent value="inteligente">
            <SmartCarrierSelector 
              onSelect={(carrier) => {
                toast.success(`Transportadora ${carrier.nome} selecionada!`);
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

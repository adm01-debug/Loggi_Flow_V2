import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Bell,
  Plus,
  Trash2,
  DollarSign,
  Truck,
  MapPin,
  Globe,
  TrendingUp,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { useCostAlerts, CostCheckResult } from '@/hooks/useCostAlerts';

const ESTADOS_BRASIL = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function AlertasCusto() {
  const {
    alertas,
    notificacoes,
    transportadoras,
    costCheckResults,
    isLoadingAlertas,
    checkCosts,
    createAlerta,
    deleteAlerta,
    updateAlerta,
    markAllAsRead,
  } = useCostAlerts();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAlertForm, setNewAlertForm] = useState({
    tipo: 'transportadora' as 'transportadora' | 'rota' | 'global',
    transportadora_id: '',
    estado_destino: '',
    limite_mensal: '',
    limite_por_entrega: '',
    notificar_percentual: '80',
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleCreateAlert = async () => {
    if (!newAlertForm.limite_mensal) {
      return;
    }

    await createAlerta.mutateAsync({
      tipo: newAlertForm.tipo,
      transportadora_id: newAlertForm.tipo === 'transportadora' ? newAlertForm.transportadora_id : null,
      estado_destino: newAlertForm.tipo === 'rota' ? newAlertForm.estado_destino : null,
      limite_mensal: parseFloat(newAlertForm.limite_mensal),
      limite_por_entrega: newAlertForm.limite_por_entrega ? parseFloat(newAlertForm.limite_por_entrega) : null,
      notificar_percentual: parseInt(newAlertForm.notificar_percentual),
      ativo: true,
      created_by: null,
    });

    setIsAddDialogOpen(false);
    setNewAlertForm({
      tipo: 'transportadora',
      transportadora_id: '',
      estado_destino: '',
      limite_mensal: '',
      limite_por_entrega: '',
      notificar_percentual: '80',
    });
  };

  const getStatusColor = (status: CostCheckResult['status']) => {
    switch (status) {
      case 'exceeded': return 'text-destructive';
      case 'critical': return 'text-warning';
      case 'warning': return 'text-amber-500';
      default: return 'text-success';
    }
  };

  const getStatusBadge = (status: CostCheckResult['status']) => {
    switch (status) {
      case 'exceeded': 
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Excedido</Badge>;
      case 'critical': 
        return <Badge className="bg-warning text-warning-foreground gap-1"><AlertTriangle className="h-3 w-3" /> Crítico</Badge>;
      case 'warning': 
        return <Badge className="bg-amber-500/20 text-amber-600 gap-1"><Bell className="h-3 w-3" /> Alerta</Badge>;
      default: 
        return <Badge className="bg-success/20 text-success gap-1"><CheckCircle2 className="h-3 w-3" /> OK</Badge>;
    }
  };

  const getProgressColor = (percentual: number) => {
    if (percentual >= 100) return 'bg-destructive';
    if (percentual >= 95) return 'bg-warning';
    if (percentual >= 80) return 'bg-amber-500';
    return 'bg-success';
  };

  // Summary stats
  const alertsExceeded = costCheckResults.filter(r => r.status === 'exceeded').length;
  const alertsCritical = costCheckResults.filter(r => r.status === 'critical').length;
  const alertsWarning = costCheckResults.filter(r => r.status === 'warning').length;
  const alertsOk = costCheckResults.filter(r => r.status === 'ok').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Alertas de Custo
            </h1>
            <p className="text-muted-foreground">
              Configure limites de gastos e receba alertas automáticos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => checkCosts()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Verificar Agora
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Novo Alerta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Alerta de Custo</DialogTitle>
                  <DialogDescription>
                    Configure um limite de gastos para monitoramento automático
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Tipo de Alerta</Label>
                    <Select
                      value={newAlertForm.tipo}
                      onValueChange={(value: 'transportadora' | 'rota' | 'global') =>
                        setNewAlertForm({ ...newAlertForm, tipo: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transportadora">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Por Transportadora
                          </div>
                        </SelectItem>
                        <SelectItem value="rota">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Por Rota (Estado)
                          </div>
                        </SelectItem>
                        <SelectItem value="global">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Total Global
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newAlertForm.tipo === 'transportadora' && (
                    <div className="space-y-2">
                      <Label>Transportadora</Label>
                      <Select
                        value={newAlertForm.transportadora_id}
                        onValueChange={(value) =>
                          setNewAlertForm({ ...newAlertForm, transportadora_id: value })
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
                  )}

                  {newAlertForm.tipo === 'rota' && (
                    <div className="space-y-2">
                      <Label>Estado de Destino</Label>
                      <Select
                        value={newAlertForm.estado_destino}
                        onValueChange={(value) =>
                          setNewAlertForm({ ...newAlertForm, estado_destino: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estado" />
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
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Limite Mensal (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="5000.00"
                        value={newAlertForm.limite_mensal}
                        onChange={(e) =>
                          setNewAlertForm({ ...newAlertForm, limite_mensal: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Limite por Entrega (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Opcional"
                        value={newAlertForm.limite_por_entrega}
                        onChange={(e) =>
                          setNewAlertForm({ ...newAlertForm, limite_por_entrega: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notificar ao atingir (%)</Label>
                    <Select
                      value={newAlertForm.notificar_percentual}
                      onValueChange={(value) =>
                        setNewAlertForm({ ...newAlertForm, notificar_percentual: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50%</SelectItem>
                        <SelectItem value="60">60%</SelectItem>
                        <SelectItem value="70">70%</SelectItem>
                        <SelectItem value="80">80%</SelectItem>
                        <SelectItem value="90">90%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateAlert} disabled={createAlerta.isPending}>
                    {createAlerta.isPending ? 'Salvando...' : 'Criar Alerta'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className={alertsExceeded > 0 ? 'border-destructive/50 bg-destructive/5' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Excedidos</p>
                  <p className="text-2xl font-bold text-foreground">{alertsExceeded}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-destructive/20 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={alertsCritical > 0 ? 'border-warning/50 bg-warning/5' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Críticos</p>
                  <p className="text-2xl font-bold text-foreground">{alertsCritical}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={alertsWarning > 0 ? 'border-amber-500/50 bg-amber-500/5' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Alerta</p>
                  <p className="text-2xl font-bold text-foreground">{alertsWarning}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dentro do Limite</p>
                  <p className="text-2xl font-bold text-foreground">{alertsOk}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Status */}
        {costCheckResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Status Atual dos Limites
              </CardTitle>
              <CardDescription>
                Monitoramento em tempo real dos gastos vs limites configurados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costCheckResults.map((result) => (
                  <div key={result.alerta.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.alerta.tipo === 'transportadora' && <Truck className="h-4 w-4 text-muted-foreground" />}
                        {result.alerta.tipo === 'rota' && <MapPin className="h-4 w-4 text-muted-foreground" />}
                        {result.alerta.tipo === 'global' && <Globe className="h-4 w-4 text-muted-foreground" />}
                        <span className="font-medium">
                          {result.alerta.tipo === 'transportadora' 
                            ? result.alerta.transportadora?.nome_fantasia 
                            : result.alerta.tipo === 'rota' 
                              ? `Rota ${result.alerta.estado_destino}` 
                              : 'Total Global'}
                        </span>
                        {getStatusBadge(result.status)}
                      </div>
                      <div className="text-right">
                        <span className={`font-semibold ${getStatusColor(result.status)}`}>
                          {formatCurrency(result.valor_atual)}
                        </span>
                        <span className="text-muted-foreground"> / {formatCurrency(result.alerta.limite_mensal)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={Math.min(result.percentual, 100)} 
                        className="h-2 flex-1"
                      />
                      <span className={`text-sm font-medium ${getStatusColor(result.status)}`}>
                        {result.percentual.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications */}
        {notificacoes && notificacoes.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notificações Recentes
                </CardTitle>
                <CardDescription>
                  {notificacoes.length} notificação(ões) não lida(s)
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => markAllAsRead.mutate()}>
                Marcar todas como lidas
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {notificacoes.slice(0, 5).map((notif) => (
                  <div 
                    key={notif.id} 
                    className={`p-3 rounded-lg border ${
                      notif.tipo_notificacao === 'exceeded' 
                        ? 'bg-destructive/10 border-destructive/30' 
                        : notif.tipo_notificacao === 'critical'
                          ? 'bg-warning/10 border-warning/30'
                          : 'bg-amber-500/10 border-amber-500/30'
                    }`}
                  >
                    <p className="text-sm">{notif.mensagem}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notif.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Alertas Configurados
            </CardTitle>
            <CardDescription>
              Gerencie os limites de custo monitorados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingAlertas ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : alertas && alertas.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead className="text-right">Limite Mensal</TableHead>
                    <TableHead className="text-right">Limite/Entrega</TableHead>
                    <TableHead className="text-center">Notificar em</TableHead>
                    <TableHead className="text-center">Ativo</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alertas.map((alerta) => (
                    <TableRow key={alerta.id}>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          {alerta.tipo === 'transportadora' && <Truck className="h-3 w-3" />}
                          {alerta.tipo === 'rota' && <MapPin className="h-3 w-3" />}
                          {alerta.tipo === 'global' && <Globe className="h-3 w-3" />}
                          {alerta.tipo === 'transportadora' ? 'Transportadora' : alerta.tipo === 'rota' ? 'Rota' : 'Global'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {alerta.tipo === 'transportadora' 
                          ? alerta.transportadora?.nome_fantasia 
                          : alerta.tipo === 'rota' 
                            ? alerta.estado_destino 
                            : 'Total Geral'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(alerta.limite_mensal)}
                      </TableCell>
                      <TableCell className="text-right">
                        {alerta.limite_por_entrega ? formatCurrency(alerta.limite_por_entrega) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {alerta.notificar_percentual}%
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={alerta.ativo}
                          onCheckedChange={(checked) => 
                            updateAlerta.mutate({ id: alerta.id, ativo: checked })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteAlerta.mutate(alerta.id)}
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
                <AlertTriangle className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  Nenhum alerta de custo configurado.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 gap-2"
                  onClick={() => setIsAddDialogOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Criar primeiro alerta
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

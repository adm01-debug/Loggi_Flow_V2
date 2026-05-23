import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatsCard } from '@/components/common/StatsCard';
import { EmptyState } from '@/components/common/EmptyState';
import { DetailSheet } from '@/components/common/DetailSheet';
import { Pagination } from '@/components/common/Pagination';
import { usePagination } from "@/hooks/common/usePagination";
import { useUnifiedTracking, UnifiedShipment, TrackingFilter } from "@/hooks/logistics/useUnifiedTracking";
import { useDelayPrediction } from "@/hooks/logistics/useDelayPrediction";
import {
  Radar, Truck, Package, AlertTriangle, Clock, CheckCircle2,
  Search, RefreshCw, MapPin, DollarSign, TrendingDown, Eye,
  Brain, ArrowRight, Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

const FILTER_TABS: { value: TrackingFilter; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'Todos', icon: Package },
  { value: 'em_transito', label: 'Em Trânsito', icon: Truck },
  { value: 'atrasados', label: 'Atrasados', icon: AlertTriangle },
  { value: 'pendentes', label: 'Pendentes', icon: Clock },
  { value: 'entregue', label: 'Entregues', icon: CheckCircle2 },
];

function formatDate(date: string | null): string {
  if (!date) return '—';
  try {
    return format(parseISO(date), 'dd/MM/yy HH:mm', { locale: ptBR });
  } catch {
    return date;
  }
}

export default function CentralRastreamento() {
  const navigate = useNavigate();
  const {
    shipments, summary, isLoading, filter, setFilter,
    searchTerm, setSearchTerm, refetch, getStatusLabel,
  } = useUnifiedTracking();

  const { isLoading: isPredicting, analyzeDelays, predictions, summary: predSummary } = useDelayPrediction();

  const [selectedShipment, setSelectedShipment] = useState<UnifiedShipment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const pagination = usePagination(shipments, { initialPageSize: 20 });

  const openDetail = (s: UnifiedShipment) => {
    navigate(`/rastreamento/${s.id}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-display flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <Radar className="w-6 h-6 text-primary" />
              </div>
              Central de Rastreamento
            </h1>
            <p className="text-muted-foreground mt-1">
              Hub unificado — entregas, coletas, todas as transportadoras
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="w-4 h-4 mr-2" />Atualizar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => analyzeDelays()}
              disabled={isPredicting}
            >
              <Brain className={cn("w-4 h-4 mr-2", isPredicting && "animate-pulse")} />
              Predição IA
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatsCard title="Total" value={summary.total} icon={Package} color="primary" />
          <StatsCard title="Em Trânsito" value={summary.emTransito} icon={Truck} color="info" />
          <StatsCard
            title="Atrasados"
            value={summary.atrasados}
            icon={AlertTriangle}
            color={summary.atrasados > 0 ? 'destructive' : 'success'}
          />
          <StatsCard title="Pendentes" value={summary.pendentes} icon={Clock} color="warning" />
          <StatsCard title="Entregues" value={summary.entregues} icon={CheckCircle2} color="success" />
        </div>

        {/* Exception Alert */}
        {summary.atrasados > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-base border-destructive/30 bg-destructive/5 p-4 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-destructive">
                {summary.atrasados} remessa(s) atrasada(s)
              </p>
              <p className="text-sm text-muted-foreground">
                Requer atenção imediata — clique em "Atrasados" para detalhes
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setFilter('atrasados')}
            >
              Ver Atrasados
            </Button>
          </motion.div>
        )}

        {/* Prediction Summary */}
        {predSummary && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4 flex items-center gap-4 flex-wrap">
              <Brain className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Predição IA:</span>
              <Badge variant="destructive">{predSummary.criticos} Críticos</Badge>
              <Badge className="bg-warning/10 text-warning border-warning/20">{predSummary.altos} Altos</Badge>
              <Badge variant="secondary">{predSummary.medios} Médios</Badge>
              <Badge className="bg-success/10 text-success">{predSummary.baixos} Baixos</Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {predSummary.total_analisados} analisados
              </span>
            </CardContent>
          </Card>
        )}

        {/* Search + Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nº, NF, destino, transportadora..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as TrackingFilter)}>
            <TabsList>
              {FILTER_TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs">
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.value === 'atrasados' && summary.atrasados > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                      {summary.atrasados}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Shipments Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : pagination.paginatedData.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Nenhuma remessa encontrada"
                description={searchTerm ? 'Tente alterar os filtros' : 'Cadastre entregas ou coletas para rastrear'}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Tipo</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Transportadora</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Previsão</TableHead>
                      <TableHead className="text-center">Atraso</TableHead>
                      <TableHead className="w-16" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.paginatedData.map((s, i) => (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className={cn(
                          'border-b cursor-pointer hover:bg-muted/50 transition-colors',
                          s.atrasado && 'bg-destructive/5'
                        )}
                        onClick={() => openDetail(s)}
                      >
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {s.tipo === 'entrega' ? '📦 Entrega' : '🚚 Coleta'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm font-medium">{s.numero}</TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate text-sm" title={s.destino}>
                            {s.destino}
                          </div>
                          {s.cliente && (
                            <span className="text-xs text-muted-foreground">{s.cliente}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{s.transportadora}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className="text-[10px]"
                            style={{ borderColor: s.statusColor, color: s.statusColor }}
                          >
                            {s.statusLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {formatDate(s.previsao)}
                        </TableCell>
                        <TableCell className="text-center">
                          {s.atrasado ? (
                            <Badge variant="destructive" className="text-[10px]">
                              {s.diasAtraso}d
                            </Badge>
                          ) : (
                            <span className="text-xs text-success">✓</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); navigate(`/rastreamento/${s.id}`); }}>
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {!isLoading && shipments.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={shipments.length}
            startIndex={(pagination.currentPage - 1) * pagination.pageSize + 1}
            endIndex={Math.min(pagination.currentPage * pagination.pageSize, shipments.length)}
            pageSizeOptions={[20, 50, 100]}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
            onNextPage={pagination.nextPage}
            onPrevPage={pagination.prevPage}
            onFirstPage={pagination.firstPage}
            onLastPage={pagination.lastPage}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
          />
        )}
      </div>

    </MainLayout>
  );
}

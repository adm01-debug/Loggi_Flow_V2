import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Package, Truck, Filter, Calendar as CalendarIcon, MapPin, Building2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useLogisticsCalendar, useTransportadoras, CalendarEvent, CalendarFilters } from '@/hooks/useLogisticsCalendar';
import { cn } from '@/lib/utils';

const coletaStatusLabels: Record<string, string> = {
  aguardando_liberacao: 'Aguardando Liberação',
  solicitada: 'Solicitada',
  em_transito: 'Em Trânsito',
  chegou_expedicao: 'Chegou Expedição',
  conferencia_ok: 'Conferência OK',
  divergencia: 'Divergência',
  finalizada: 'Finalizada',
};

const entregaStatusLabels: Record<string, string> = {
  aguardando_producao: 'Aguardando Produção',
  pronto_despacho: 'Pronto Despacho',
  cotacao_frete: 'Cotação Frete',
  nf_emitida: 'NF Emitida',
  despachado: 'Despachado',
  em_transito: 'Em Trânsito',
  saiu_entrega: 'Saiu Entrega',
  entregue: 'Entregue',
  ocorrencia: 'Ocorrência',
  finalizado: 'Finalizado',
};

const statusColors: Record<string, string> = {
  aguardando_liberacao: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  solicitada: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  em_transito: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  chegou_expedicao: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  conferencia_ok: 'bg-green-500/20 text-green-400 border-green-500/30',
  divergencia: 'bg-red-500/20 text-red-400 border-red-500/30',
  finalizada: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  aguardando_producao: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  pronto_despacho: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  cotacao_frete: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  nf_emitida: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  despachado: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  saiu_entrega: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  entregue: 'bg-green-500/20 text-green-400 border-green-500/30',
  ocorrencia: 'bg-red-500/20 text-red-400 border-red-500/30',
  finalizado: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

const CalendarioLogistico = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filters, setFilters] = useState<CalendarFilters>({
    status: [],
    transportadoraId: null,
    type: 'all',
  });

  const { data: events = [], isLoading } = useLogisticsCalendar(filters);
  const { data: transportadoras = [] } = useTransportadoras();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach(event => {
      const dateKey = format(event.date, 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [events]);

  const getEventsForDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return eventsByDate.get(dateKey) || [];
  };

  const allStatuses = [
    ...Object.keys(coletaStatusLabels),
    ...Object.keys(entregaStatusLabels),
  ];

  const toggleStatus = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status],
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      transportadoraId: null,
      type: 'all',
    });
  };

  const stats = useMemo(() => {
    const coletas = events.filter(e => e.type === 'coleta').length;
    const entregas = events.filter(e => e.type === 'entrega').length;
    const today = events.filter(e => isSameDay(e.date, new Date())).length;
    return { coletas, entregas, today, total: coletas + entregas };
  }, [events]);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendário Logístico</h1>
            <p className="text-muted-foreground">
              Visualize coletas e entregas agendadas
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                  {(filters.status.length > 0 || filters.transportadoraId || filters.type !== 'all') && (
                    <Badge variant="secondary" className="ml-1">
                      {filters.status.length + (filters.transportadoraId ? 1 : 0) + (filters.type !== 'all' ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filtros</h4>
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Limpar
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo</label>
                    <Select
                      value={filters.type}
                      onValueChange={(value: 'all' | 'coleta' | 'entrega') =>
                        setFilters(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="coleta">Coletas</SelectItem>
                        <SelectItem value="entrega">Entregas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Transportadora</label>
                    <Select
                      value={filters.transportadoraId || 'all'}
                      onValueChange={(value) =>
                        setFilters(prev => ({
                          ...prev,
                          transportadoraId: value === 'all' ? null : value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {transportadoras.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.nome_fantasia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {Object.entries({ ...coletaStatusLabels, ...entregaStatusLabels }).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={filters.status.includes(key)}
                            onCheckedChange={() => toggleStatus(key)}
                          />
                          <span className="truncate">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Package className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.coletas}</p>
                  <p className="text-sm text-muted-foreground">Coletas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Truck className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.entregas}</p>
                  <p className="text-sm text-muted-foreground">Entregas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <CalendarIcon className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.today}</p>
                  <p className="text-sm text-muted-foreground">Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <CalendarIcon className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total no Mês</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month start */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-start-${i}`} className="min-h-24 p-1" />
              ))}

              {/* Days of the month */}
              {daysInMonth.map((day) => {
                const dayEvents = getEventsForDay(day);
                const hasColeta = dayEvents.some(e => e.type === 'coleta');
                const hasEntrega = dayEvents.some(e => e.type === 'entrega');

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'min-h-24 p-1 border rounded-lg transition-colors',
                      isToday(day) && 'border-primary bg-primary/5',
                      !isToday(day) && 'border-border/50 hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          'text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full',
                          isToday(day) && 'bg-primary text-primary-foreground'
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      <div className="flex gap-1">
                        {hasColeta && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                        {hasEntrega && (
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-16">
                      {dayEvents.slice(0, 3).map((event) => (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={cn(
                            'w-full text-left px-1.5 py-0.5 rounded text-xs truncate transition-colors',
                            event.type === 'coleta'
                              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                              : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          )}
                        >
                          {event.title}
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-xs text-muted-foreground px-1">
                          +{dayEvents.length - 3} mais
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-muted-foreground">Coleta</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">Entrega</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Details Modal */}
        {selectedEvent && (
          <Card className="fixed bottom-4 right-4 w-96 shadow-xl z-50 animate-in slide-in-from-right">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedEvent.type === 'coleta' ? (
                    <Package className="h-5 w-5 text-blue-400" />
                  ) : (
                    <Truck className="h-5 w-5 text-green-400" />
                  )}
                  <CardTitle className="text-lg">{selectedEvent.title}</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEvent(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={cn('border', statusColors[selectedEvent.status])}>
                  {selectedEvent.type === 'coleta'
                    ? coletaStatusLabels[selectedEvent.status]
                    : entregaStatusLabels[selectedEvent.status]}
                </Badge>
                <Badge variant="outline">
                  {selectedEvent.type === 'coleta' ? 'Coleta' : 'Entrega'}
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{format(selectedEvent.date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">{selectedEvent.details.endereco}</span>
                </div>

                {selectedEvent.transportadora && (
                  <div className="flex items-start gap-2">
                    <Truck className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{selectedEvent.transportadora}</span>
                  </div>
                )}

                {selectedEvent.details.cliente && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{selectedEvent.details.cliente}</span>
                  </div>
                )}

                {selectedEvent.details.fornecedor && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{selectedEvent.details.fornecedor}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default CalendarioLogistico;

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useRodonavesTracking } from '@/hooks';
import { Truck, CalendarDays, XCircle, RefreshCw, Search, Loader2, Calendar, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface RTEPickupActionsProps {
  coletaId?: string;
  protocolNumber?: number;
  onActionComplete?: () => void;
}

export function RTEPickupActions({ coletaId, protocolNumber, onActionComplete }: RTEPickupActionsProps) {
  const rte = useRodonavesTracking();
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showDates, setShowDates] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [protocol, setProtocol] = useState(protocolNumber?.toString() || '');

  const handleCancel = async () => {
    if (!protocol) { toast.error('Informe o protocolo'); return; }
    rte.cancelPickup({ protocol: parseInt(protocol) });
    onActionComplete?.();
  };

  const handleReschedule = async () => {
    if (!protocol || !newDate) { toast.error('Informe protocolo e nova data'); return; }
    rte.reschedulePickup({ protocol: parseInt(protocol), pickupDate: new Date(newDate).toISOString() });
    setShowReschedule(false);
    onActionComplete?.();
  };

  const handleCheckDates = () => {
    if (!protocol) { toast.error('Informe o protocolo'); return; }
    rte.getAvailablePickupDates({ protocol: parseInt(protocol) });
    setShowDates(true);
  };

  const handleTrack = () => {
    if (!protocol) { toast.error('Informe o protocolo'); return; }
    rte.getPickupByProtocol({ protocol: parseInt(protocol) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Truck className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold">Ações Rodonaves RTE</span>
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="Protocolo RTE"
          value={protocol}
          onChange={(e) => setProtocol(e.target.value)}
          className="w-40"
          type="number"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleTrack} disabled={!protocol}>
          <Search className="w-3 h-3 mr-1" />Consultar
        </Button>
        <Button variant="outline" size="sm" onClick={handleCheckDates} disabled={!protocol}>
          <CalendarDays className="w-3 h-3 mr-1" />Datas Disponíveis
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowReschedule(true)} disabled={!protocol}>
          <RefreshCw className="w-3 h-3 mr-1" />Reagendar
        </Button>
        <Button variant="destructive" size="sm" onClick={handleCancel} disabled={!protocol || rte.isCanceling}>
          {rte.isCanceling ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <XCircle className="w-3 h-3 mr-1" />}
          Cancelar Coleta
        </Button>
      </div>

      {/* Pickup Result Display */}
      {rte.pickupResult?.data && (
        <div className="p-3 rounded-lg border bg-muted/30 space-y-2 text-sm">
          <div className="font-semibold flex items-center gap-1">
            <Truck className="w-4 h-4" /> Coleta RTE
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-muted-foreground">Protocolo:</span> {rte.pickupResult.data.Protocol || rte.pickupResult.data.protocol}</div>
            <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline">{rte.pickupResult.data.Status || rte.pickupResult.data.status || 'N/A'}</Badge></div>
            {rte.pickupResult.data.PickupDate && (
              <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(rte.pickupResult.data.PickupDate).toLocaleDateString('pt-BR')}</div>
            )}
            {rte.pickupResult.data.Address && (
              <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {rte.pickupResult.data.Address}</div>
            )}
          </div>
        </div>
      )}

      {/* Available Dates Display */}
      {showDates && rte.availableDatesResult?.data && (
        <div className="p-3 rounded-lg border bg-muted/30 space-y-2 text-sm">
          <div className="font-semibold flex items-center gap-1">
            <CalendarDays className="w-4 h-4" /> Datas Disponíveis
          </div>
          {Array.isArray(rte.availableDatesResult.data) ? (
            <div className="flex flex-wrap gap-2">
              {rte.availableDatesResult.data.map((date: string, i: number) => (
                <Badge key={i} variant="secondary" className="cursor-pointer hover:bg-primary/20" onClick={() => { setNewDate(date); setShowReschedule(true); }}>
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(date).toLocaleDateString('pt-BR')}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Dados recebidos - verifique o formato</p>
          )}
        </div>
      )}

      {/* Reschedule Dialog */}
      <Dialog open={showReschedule} onOpenChange={setShowReschedule}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Reagendar Coleta RTE</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Protocolo</Label>
              <Input value={protocol} onChange={(e) => setProtocol(e.target.value)} type="number" />
            </div>
            <div>
              <Label>Nova Data</Label>
              <Input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReschedule(false)}>Cancelar</Button>
            <Button onClick={handleReschedule} disabled={rte.isRescheduling}>
              {rte.isRescheduling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Reagendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

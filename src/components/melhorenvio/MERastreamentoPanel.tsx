import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useMelhorEnvio } from "@/hooks/logistics/useMelhorEnvio";
import { MapPin, Loader2, Search, Package, Plus, Trash2 } from 'lucide-react';
import type { METrackingInfo, METrackingEvent } from './types';

export function MERastreamentoPanel() {
  const { rastrearEnvios } = useMelhorEnvio();
  const [orderIds, setOrderIds] = useState<string[]>(['']);
  const [results, setResults] = useState<Record<string, METrackingInfo>>({});

  const addField = () => setOrderIds([...orderIds, '']);
  const removeField = (i: number) => setOrderIds(orderIds.filter((_, idx) => idx !== i));
  const updateField = (i: number, val: string) => {
    const updated = [...orderIds];
    updated[i] = val;
    setOrderIds(updated);
  };

  const handleTrack = () => {
    const validIds = orderIds.filter(id => id.trim());
    if (validIds.length === 0) return;
    rastrearEnvios.mutate(validIds, {
      onSuccess: (data) => setResults((data || {}) as Record<string, METrackingInfo>),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Rastreamento de Envios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {orderIds.map((id, i) => (
              <div key={i} className="flex gap-2">
                <Input placeholder="ID da etiqueta / pedido" value={id} onChange={(e) => updateField(i, e.target.value)} />
                {orderIds.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeField(i)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addField}>
              <Plus className="w-4 h-4 mr-1" /> Adicionar ID
            </Button>
          </div>

          <Button onClick={handleTrack} disabled={rastrearEnvios.isPending} className="w-full">
            {rastrearEnvios.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
            Rastrear
          </Button>
        </CardContent>
      </Card>

      {Object.keys(results).length > 0 && (
        <div className="space-y-4">
          {Object.entries(results).map(([orderId, info]) => (
            <Card key={orderId}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Pedido: <span className="font-mono">{orderId}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {info.tracking ? (
                  <div className="space-y-3">
                    <div className="flex gap-2 items-center">
                      <Label>Código:</Label>
                      <Badge variant="outline" className="font-mono">{info.tracking}</Badge>
                    </div>
                    {info.melhorenvio_tracking && (
                      <div className="space-y-2">
                        {(Array.isArray(info.melhorenvio_tracking) ? info.melhorenvio_tracking : []).map((event: METrackingEvent, idx: number) => (
                          <div key={idx} className="flex gap-3 items-start">
                            <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                            <div>
                              <p className="text-sm font-medium">{event.title || event.status}</p>
                              <p className="text-xs text-muted-foreground">{event.description}</p>
                              <p className="text-xs text-muted-foreground">{event.date}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Status: {info.status || 'Sem informações'}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

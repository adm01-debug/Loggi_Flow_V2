import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useRodonavesTracking } from '@/hooks/useRodonavesTracking';
import { Search, Loader2, Package, FileText } from 'lucide-react';

export function RTEOrdersPanel() {
  const rte = useRodonavesTracking();
  const [cnpj, setCnpj] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [page, setPage] = useState(1);

  const handleSearch = () => {
    if (!cnpj || !startDate || !endDate) return;
    rte.getOrders({
      cnpjRemetente: cnpj,
      startDate,
      endDate,
      invoiceNumber: invoiceNumber || undefined,
      page,
      amountByPage: 20,
    });
  };

  const orders = rte.ordersResult as { data?: Array<Record<string, any>> } | undefined;
  const items = Array.isArray(orders?.data) ? orders.data : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Pedidos/Ordens RTE</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><Label>CNPJ Remetente *</Label><Input value={cnpj} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" /></div>
        <div><Label>Data Início *</Label><Input type="date" value={startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} /></div>
        <div><Label>Data Fim *</Label><Input type="date" value={endDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)} /></div>
        <div><Label>NF (opcional)</Label><Input value={invoiceNumber} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceNumber(e.target.value)} /></div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleSearch} disabled={rte.isLoadingOrders}>
          {rte.isLoadingOrders ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}Consultar Pedidos
        </Button>
        <div className="flex items-center gap-1">
          <Label className="text-xs">Pg:</Label>
          <Input type="number" value={page} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPage(parseInt(e.target.value) || 1)} className="w-16 h-8" min={1} />
        </div>
      </div>

      {items.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <p className="text-sm text-muted-foreground">{items.length} pedido(s) encontrado(s)</p>
          {items.map((order, i) => (
            <div key={i} className="p-3 rounded-lg border bg-card space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{String(order.ProtocolNumber || order.protocolNumber || order.protocol || `#${i + 1}`)}</span>
                <Badge variant="outline">{String(order.Status || order.status || 'N/A')}</Badge>
              </div>
              {order.InvoiceNumber && <p className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" />NF: {String(order.InvoiceNumber)}</p>}
              {order.RecipientName && <p className="text-xs text-muted-foreground">Destinatário: {String(order.RecipientName)}</p>}
              {order.Value && <p className="text-xs text-muted-foreground">Valor: R$ {Number(order.Value).toFixed(2)}</p>}
            </div>
          ))}
        </div>
      )}

      {orders && items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pedido encontrado no período.</p>}
    </div>
  );
}

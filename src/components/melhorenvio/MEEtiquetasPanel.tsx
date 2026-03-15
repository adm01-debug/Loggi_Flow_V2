import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useMelhorEnvio } from '@/hooks/useMelhorEnvio';
import { Tag, Printer, Eye, XCircle, Search, Loader2, RefreshCw, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function MEEtiquetasPanel() {
  const { listarEtiquetas, gerarEtiquetas, imprimirEtiquetas, preVisualizarEtiquetas, verificarCancelamento, cancelarEtiquetas, pesquisarEtiqueta } = useMelhorEnvio();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const orders = Array.isArray(listarEtiquetas.data?.data) ? listarEtiquetas.data.data : 
                 Array.isArray(listarEtiquetas.data) ? listarEtiquetas.data : [];

  const displayOrders = searchResults.length > 0 ? searchResults : orders;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    pesquisarEtiqueta.mutate({ q: searchQuery }, {
      onSuccess: (data) => setSearchResults(Array.isArray(data?.data) ? data.data : []),
    });
  };

  const handleGenerate = () => {
    if (selectedIds.length === 0) return;
    gerarEtiquetas.mutate(selectedIds);
  };

  const handlePrint = () => {
    if (selectedIds.length === 0) return;
    imprimirEtiquetas.mutate({ orders: selectedIds }, {
      onSuccess: (data) => {
        if (data?.url) window.open(data.url, '_blank');
      },
    });
  };

  const handlePreview = () => {
    if (selectedIds.length === 0) return;
    preVisualizarEtiquetas.mutate(selectedIds, {
      onSuccess: (data) => {
        if (data?.url) setPreviewUrl(data.url);
      },
    });
  };

  const handleCancel = () => {
    if (selectedIds.length === 0) return;
    cancelarEtiquetas.mutate({ orders: selectedIds });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'released': return 'default';
      case 'posted': return 'secondary';
      case 'delivered': return 'outline';
      case 'canceled': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Etiquetas de Envio
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-1">
              <Input placeholder="Buscar etiqueta..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-48" />
              <Button variant="outline" size="icon" onClick={handleSearch} disabled={pesquisarEtiqueta.isPending}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => listarEtiquetas.refetch()}>
              <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedIds.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              <Button size="sm" onClick={handleGenerate} disabled={gerarEtiquetas.isPending}>
                {gerarEtiquetas.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileText className="w-4 h-4 mr-1" />}
                Gerar ({selectedIds.length})
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint} disabled={imprimirEtiquetas.isPending}>
                <Printer className="w-4 h-4 mr-1" /> Imprimir
              </Button>
              <Button size="sm" variant="outline" onClick={handlePreview}>
                <Eye className="w-4 h-4 mr-1" /> Pré-visualizar
              </Button>
              <Button size="sm" variant="destructive" onClick={handleCancel} disabled={cancelarEtiquetas.isPending}>
                <XCircle className="w-4 h-4 mr-1" /> Cancelar
              </Button>
            </div>
          )}

          {listarEtiquetas.isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : displayOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma etiqueta encontrada</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input type="checkbox" checked={selectedIds.length === displayOrders.length && displayOrders.length > 0} onChange={() => setSelectedIds(selectedIds.length === displayOrders.length ? [] : displayOrders.map((o: any) => o.id))} />
                  </TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Rastreio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <input type="checkbox" checked={selectedIds.includes(order.id)} onChange={() => toggleSelect(order.id)} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{order.id?.substring(0, 8)}...</TableCell>
                    <TableCell>{order.service || '-'}</TableCell>
                    <TableCell className="text-xs">{order.to?.postal_code || '-'}</TableCell>
                    <TableCell><Badge variant={statusColor(order.status)}>{order.status || '-'}</Badge></TableCell>
                    <TableCell className="font-semibold">R$ {order.price || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{order.tracking || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {previewUrl && (
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader><DialogTitle>Pré-visualização da Etiqueta</DialogTitle></DialogHeader>
            <iframe src={previewUrl} className="w-full h-[60vh] border rounded" />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

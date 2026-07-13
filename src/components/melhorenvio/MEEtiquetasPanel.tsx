import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useMelhorEnvio } from "@/hooks/logistics/useMelhorEnvio";
import { Tag, Printer, Eye, XCircle, Search, Loader2, RefreshCw, FileText, Info, CheckCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { TableSkeleton } from '@/components/ui/skeletons';
import { MEDetailDialog } from './MEDetailDialog';
import { MEErrorState } from './MEErrorState';
import { DataExporter } from '@/components/common/DataExporter';
import { usePagination } from "@/hooks/common/usePagination";
import { Pagination } from '@/components/common/Pagination';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { MEOrder } from './types';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'released', label: 'Liberada' },
  { value: 'posted', label: 'Postada' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'canceled', label: 'Cancelada' },
];

export function MEEtiquetasPanel() {
  const { listarEtiquetas, gerarEtiquetas, imprimirEtiquetas, preVisualizarEtiquetas, verificarCancelamento, cancelarEtiquetas, pesquisarEtiqueta, infoEtiqueta, imprimirEtiquetasArquivo } = useMelhorEnvio();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchResults, setSearchResults] = useState<MEOrder[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [labelDetail, setLabelDetail] = useState<Record<string, unknown> | null>(null);
  const [cancellableInfo, setCancellableInfo] = useState<Record<string, unknown> | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const rawData = listarEtiquetas.data;
  const rawDataObj = rawData as Record<string, unknown> | undefined;
  let orders: MEOrder[] = [];
  if (Array.isArray(rawDataObj?.data)) orders = rawDataObj!.data as MEOrder[];
  else if (Array.isArray(rawData)) orders = rawData as MEOrder[];


  const baseOrders = searchResults.length > 0 ? searchResults : orders;
  const filteredOrders = statusFilter === 'all'
    ? baseOrders
    : baseOrders.filter(o => o.status === statusFilter);

  const pagination = usePagination(filteredOrders, { initialPageSize: 10 });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    pesquisarEtiqueta.mutate({ q: searchQuery }, {
      onSuccess: (data) => {
        const d = data as Record<string, unknown>;
        setSearchResults(Array.isArray(d?.data) ? d.data as MEOrder[] : []);
      },
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
        const d = data as Record<string, unknown>;
        if (d?.url) window.open(d.url as string, '_blank');
      },
    });
  };

  const handlePrintFile = (id: string) => {
    imprimirEtiquetasArquivo.mutate(id, {
      onSuccess: (data) => {
        const d = data as Record<string, unknown>;
        if (d?.url) window.open(d.url as string, '_blank');
      },
    });
  };

  const handlePreview = () => {
    if (selectedIds.length === 0) return;
    preVisualizarEtiquetas.mutate(selectedIds, {
      onSuccess: (data) => {
        const d = data as Record<string, unknown>;
        if (d?.url) setPreviewUrl(d.url as string);
      },
    });
  };

  const handleCheckCancellable = () => {
    if (selectedIds.length === 0) return;
    verificarCancelamento.mutate(selectedIds, {
      onSuccess: (data) => setCancellableInfo(data as Record<string, unknown>),
    });
  };

  const handleCancel = () => {
    if (selectedIds.length === 0) return;
    cancelarEtiquetas.mutate({ orders: selectedIds });
    setCancellableInfo(null);
    setShowCancelConfirm(false);
  };

  const handleViewDetail = (id: string) => {
    infoEtiqueta.mutate(id, {
      onSuccess: (data) => setLabelDetail(data as Record<string, unknown>),
    });
  };

  const statusColor = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case 'released': return 'default';
      case 'posted': return 'secondary';
      case 'delivered': return 'outline';
      case 'canceled': return 'destructive';
      default: return 'secondary';
    }
  };

  const exportData = filteredOrders.map(o => ({
    id: o.id,
    service: o.service || '-',
    destino: o.to?.postal_code || '-',
    status: o.status || '-',
    preco: o.price || '-',
    rastreio: o.tracking || '-',
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Etiquetas de Envio
          </CardTitle>
          <div className="flex gap-2 flex-wrap items-center">
            <div className="flex gap-1">
              <Input placeholder="Buscar etiqueta..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-48" />
              <Button variant="outline" size="icon" onClick={handleSearch} disabled={pesquisarEtiqueta.isPending}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DataExporter data={exportData} filename="etiquetas-melhor-envio" />
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
                {imprimirEtiquetas.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Printer className="w-4 h-4 mr-1" />}
                Imprimir
              </Button>
              <Button size="sm" variant="outline" onClick={handlePreview} disabled={preVisualizarEtiquetas.isPending}>
                {preVisualizarEtiquetas.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Eye className="w-4 h-4 mr-1" />}
                Pré-visualizar
              </Button>
              <Button size="sm" variant="outline" onClick={handleCheckCancellable} disabled={verificarCancelamento.isPending}>
                {verificarCancelamento.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                Verificar Cancelamento
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setShowCancelConfirm(true)} disabled={cancelarEtiquetas.isPending}>
                {cancelarEtiquetas.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <XCircle className="w-4 h-4 mr-1" />}
                Cancelar
              </Button>
            </div>
          )}

          {listarEtiquetas.isLoading ? (
            <TableSkeleton rows={5} columns={8} />
          ) : listarEtiquetas.isError ? (
            <MEErrorState message="Erro ao carregar etiquetas." onRetry={() => listarEtiquetas.refetch()} />
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              variant="inbox"
              title="Nenhuma etiqueta encontrada"
              description={statusFilter !== 'all' ? 'Nenhuma etiqueta com este status. Tente outro filtro.' : 'Compre fretes no carrinho para gerar etiquetas.'}
              size="sm"
            />
          ) : (
            <>
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedIds.length === filteredOrders.length && filteredOrders.length > 0}
                          onCheckedChange={() => setSelectedIds(selectedIds.length === filteredOrders.length ? [] : filteredOrders.map((o) => o.id))}
                        />
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Destino</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Rastreio</TableHead>
                      <TableHead className="w-20" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagination.paginatedData.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Checkbox checked={selectedIds.includes(order.id)} onCheckedChange={() => toggleSelect(order.id)} />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{order.id?.substring(0, 8)}...</TableCell>
                        <TableCell>{order.service || '-'}</TableCell>
                        <TableCell className="text-xs">{order.to?.postal_code || '-'}</TableCell>
                        <TableCell><Badge variant={statusColor(order.status || '')}>{order.status || '-'}</Badge></TableCell>
                        <TableCell className="font-semibold">R$ {order.price || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{order.tracking || '-'}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleViewDetail(order.id)} disabled={infoEtiqueta.isPending}>
                              <Info className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handlePrintFile(order.id)} disabled={imprimirEtiquetasArquivo.isPending}>
                              <Printer className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                hasNextPage={pagination.hasNextPage}
                hasPrevPage={pagination.hasPrevPage}
                pageSizeOptions={pagination.pageSizeOptions}
                onPageChange={pagination.setPage}
                onPageSizeChange={pagination.setPageSize}
                onNextPage={pagination.nextPage}
                onPrevPage={pagination.prevPage}
                onFirstPage={pagination.firstPage}
                onLastPage={pagination.lastPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        title="Cancelar etiquetas"
        description={`Tem certeza que deseja cancelar ${selectedIds.length} etiqueta(s)? Esta ação não pode ser desfeita.`}
        confirmText="Cancelar Etiquetas"
        type="danger"
        onConfirm={handleCancel}
      />

      {previewUrl && (
        <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader><DialogTitle>Pré-visualização da Etiqueta</DialogTitle></DialogHeader>
            <iframe src={previewUrl} className="w-full h-[60vh] border rounded" title="Pré-visualização" />
          </DialogContent>
        </Dialog>
      )}

      <MEDetailDialog
        open={!!labelDetail}
        onOpenChange={() => setLabelDetail(null)}
        title="Detalhes da Etiqueta"
        data={labelDetail}
      />

      {cancellableInfo && (
        <MEDetailDialog
          open={!!cancellableInfo}
          onOpenChange={() => setCancellableInfo(null)}
          title="Verificação de Cancelamento"
          data={cancellableInfo}
        />
      )}
    </div>
  );
}

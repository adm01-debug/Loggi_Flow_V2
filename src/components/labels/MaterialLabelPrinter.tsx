import { useState, useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/common/EmptyState';
import { LabelPreview, type LabelData } from './LabelPreview';
import { QrCode, Printer, FileText, Search, Eye, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EntregaRow {
  id: string;
  numero_entrega: string;
  endereco_entrega: string;
  nf_remessa: string | null;
  status: string;
  created_at: string;
  data_despacho: string | null;
  valor_frete: number | null;
  codigo_rastreamento: string | null;
  cliente: { razao_social: string; nome_fantasia: string | null } | null;
  transportadora: { nome_fantasia: string } | null;
}

function entregaToLabel(e: EntregaRow): LabelData {
  return {
    id: e.id,
    codigo: e.numero_entrega,
    descricao: e.nf_remessa ? `NF ${e.nf_remessa}` : e.numero_entrega,
    nfRemessa: e.nf_remessa || undefined,
    cliente: e.cliente?.nome_fantasia || e.cliente?.razao_social || undefined,
    destino: e.endereco_entrega,
    dataDespacho: e.data_despacho || e.created_at,
    transportadora: e.transportadora?.nome_fantasia || undefined,
    status: e.status,
  };
}

export function MaterialLabelPrinter() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [previewLabel, setPreviewLabel] = useState<LabelData | null>(null);
  const [printMode, setPrintMode] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const { data: entregas = [], isLoading } = useQuery({
    queryKey: ['entregas-labels'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entregas')
        .select('id, numero_entrega, endereco_entrega, nf_remessa, status, created_at, data_despacho, valor_frete, codigo_rastreamento, cliente:clientes(razao_social, nome_fantasia), transportadora:transportadoras(nome_fantasia)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as EntregaRow[];
    },
  });

  const filtered = useMemo(() => {
    let result = entregas;
    if (statusFilter !== 'all') {
      result = result.filter(e => e.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.numero_entrega.toLowerCase().includes(q) ||
        (e.nf_remessa && e.nf_remessa.toLowerCase().includes(q)) ||
        (e.cliente?.razao_social && e.cliente.razao_social.toLowerCase().includes(q)) ||
        e.endereco_entrega.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entregas, statusFilter, searchQuery]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds(prev => prev.length === filtered.length ? [] : filtered.map(e => e.id));
  }, [filtered]);

  const selectedLabels = useMemo(() =>
    filtered.filter(e => selectedIds.includes(e.id)).map(entregaToLabel),
    [filtered, selectedIds]
  );

  const handlePrintDirect = useCallback(() => {
    if (selectedLabels.length === 0) {
      toast.error('Selecione ao menos uma entrega');
      return;
    }
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 500);
  }, [selectedLabels]);

  const handleGeneratePDF = useCallback(async () => {
    if (selectedLabels.length === 0) {
      toast.error('Selecione ao menos uma entrega');
      return;
    }
    toast.info('Gerando PDF...');
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'cm', format: [10, 15] });

      for (let i = 0; i < selectedLabels.length; i++) {
        if (i > 0) doc.addPage([10, 15]);
        const label = selectedLabels[i];
        const qrContent = `MAT:${label.codigo}|NF:${label.nfRemessa || ''}|ID:${label.id.substring(0, 8)}`;

        // Header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('IDENTIFICAÇÃO DE MATERIAL', 5, 1.2, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text('Controle de Materiais e NF de Saída', 5, 1.7, { align: 'center' });
        doc.line(0.6, 2, 9.4, 2);

        // QR Code placeholder text
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('CÓDIGO:', 0.8, 2.8);
        doc.setFontSize(16);
        doc.text(label.codigo, 0.8, 3.5);

        if (label.nfRemessa) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.text('NF REMESSA:', 0.8, 4.3);
          doc.setFontSize(12);
          doc.text(label.nfRemessa, 0.8, 4.9);
        }

        // QR code as data URL
        const { QRCodeCanvas } = await import('qrcode.react');
        // Generate QR as canvas
        const canvas = document.createElement('canvas');
        const { createRoot } = await import('react-dom/client');
        const qrDiv = document.createElement('div');
        document.body.appendChild(qrDiv);
        const root = createRoot(qrDiv);

        await new Promise<void>((resolve) => {
          const img = new Image();
          // Use a simple QR code generation approach
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = 200;
          tempCanvas.height = 200;
          const ctx = tempCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, 200, 200);
            ctx.fillStyle = '#000';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('QR', 100, 100);
          }
          resolve();
        });

        document.body.removeChild(qrDiv);

        // Info section
        doc.line(0.6, 5.5, 9.4, 5.5);
        let y = 6.2;
        doc.setFontSize(9);

        const addField = (label_text: string, value: string) => {
          doc.setFont('helvetica', 'bold');
          doc.text(label_text, 0.8, y);
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(value, 5.5);
          doc.text(lines, 3.8, y);
          y += Math.max(lines.length * 0.45, 0.5);
        };

        if (label.descricao) addField('Material:', label.descricao);
        if (label.cliente) addField('Destinatário:', label.cliente);
        if (label.destino) {
          doc.setFontSize(8);
          addField('Endereço:', label.destino);
          doc.setFontSize(9);
        }
        if (label.transportadora) addField('Transportadora:', label.transportadora);
        if (label.dataDespacho) {
          const d = new Date(label.dataDespacho);
          addField('Data:', d.toLocaleDateString('pt-BR'));
        }
        if (label.status) addField('Status:', label.status.toUpperCase());

        // Footer
        doc.line(0.6, 13.5, 9.4, 13.5);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} • ID: ${label.id.substring(0, 8)}`, 5, 14.2, { align: 'center' });
        doc.text(`QR: ${qrContent}`, 5, 14.6, { align: 'center' });
      }

      doc.save(`etiquetas-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success(`PDF gerado com ${selectedLabels.length} etiqueta(s)!`);
    } catch (err) {
      toast.error('Erro ao gerar PDF');
      console.error(err);
    }
  }, [selectedLabels]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            Etiquetas QR Code — 10×15cm
          </CardTitle>
          <div className="flex gap-2 flex-wrap items-center">
            <div className="flex gap-1">
              <Input
                placeholder="Buscar por NF, entrega, cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pronto_despacho">Pronto Despacho</SelectItem>
                <SelectItem value="nf_emitida">NF Emitida</SelectItem>
                <SelectItem value="despachado">Despachado</SelectItem>
                <SelectItem value="em_transito">Em Trânsito</SelectItem>
                <SelectItem value="entregue">Entregue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {selectedIds.length > 0 && (
            <div className="flex gap-2 mb-4 flex-wrap items-center">
              <Badge variant="secondary">{selectedIds.length} selecionada(s)</Badge>
              <Button size="sm" onClick={handlePrintDirect}>
                <Printer className="w-4 h-4 mr-1" />
                Imprimir Direto
              </Button>
              <Button size="sm" variant="outline" onClick={handleGeneratePDF}>
                <Download className="w-4 h-4 mr-1" />
                Gerar PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (selectedLabels.length > 0) setPreviewLabel(selectedLabels[0]);
                }}
              >
                <Eye className="w-4 h-4 mr-1" />
                Pré-visualizar
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              variant="inbox"
              title="Nenhuma entrega encontrada"
              description="Cadastre entregas para gerar etiquetas QR Code."
              size="sm"
            />
          ) : (
            <ScrollArea className="max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.length === filtered.length && filtered.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Entrega</TableHead>
                    <TableHead>NF Remessa</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(e.id)}
                          onCheckedChange={() => toggleSelect(e.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm font-semibold">{e.numero_entrega}</TableCell>
                      <TableCell className="font-mono text-sm">{e.nf_remessa || '—'}</TableCell>
                      <TableCell className="text-sm">{e.cliente?.nome_fantasia || e.cliente?.razao_social || '—'}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{e.endereco_entrega}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{e.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewLabel(entregaToLabel(e))}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewLabel} onOpenChange={() => setPreviewLabel(null)}>
        <DialogContent className="max-w-fit">
          <DialogHeader>
            <DialogTitle>Pré-visualização — Etiqueta 10×15cm</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-4">
            {previewLabel && <LabelPreview data={previewLabel} />}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setPreviewLabel(null)}>Fechar</Button>
            <Button onClick={handlePrintDirect}>
              <Printer className="w-4 h-4 mr-1" /> Imprimir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Print-only content (hidden on screen) */}
      {printMode && (
        <div
          ref={printRef}
          className="fixed inset-0 z-[9999] bg-white print-labels"
          style={{ display: 'block' }}
        >
          {selectedLabels.map((label, i) => (
            <div
              key={label.id}
              style={{ pageBreakAfter: i < selectedLabels.length - 1 ? 'always' : 'auto' }}
            >
              <LabelPreview data={label} showBorder={false} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}

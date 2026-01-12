import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { 
  FileSpreadsheet, Plus, Upload, Wand2, CheckCircle2, AlertTriangle, 
  Clock, XCircle, MoreVertical, ArrowLeftRight, Trash2, Check, X,
  FileText, TrendingUp, TrendingDown, Minus, Eye, Download, Loader2, RefreshCw, FileCheck, LucideIcon
} from "lucide-react";
import { useConciliacao, Conciliacao, ItemImportado } from "@/hooks/useConciliacao";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const TIPOS_CONCILIACAO = [
  { value: "faturas_entregas", label: "Faturas x Entregas", description: "Compare faturas de transportadoras com entregas" },
  { value: "custos_previstos_realizados", label: "Custos Previstos x Realizados", description: "Compare custos cotados com valores reais" },
  { value: "pagamentos_notas", label: "Pagamentos x Notas Fiscais", description: "Concilie pagamentos com NFs emitidas" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: LucideIcon }> = {
  pendente: { bg: "bg-muted", text: "text-muted-foreground", icon: Clock },
  conciliado: { bg: "bg-success/10", text: "text-success", icon: CheckCircle2 },
  divergencia: { bg: "bg-warning/10", text: "text-warning", icon: AlertTriangle },
  ignorado: { bg: "bg-destructive/10", text: "text-destructive", icon: XCircle },
};

export default function ConciliacaoFinanceira() {
  const {
    conciliacoes, isLoadingConciliacoes, selectedConciliacao, setSelectedConciliacao,
    itensImportados, isLoadingItens, entregasSistema,
    createConciliacao, importFile, autoMatch, manualMatch, finalizeConciliacao, deleteConciliacao,
  } = useConciliacao();

  const [dlgNova, setDlgNova] = useState(false);
  const [dlgMatch, setDlgMatch] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemImportado | null>(null);
  const [form, setForm] = useState({ tipo: "faturas_entregas" as Conciliacao["tipo"], nome: "", descricao: "", periodo_inicio: "", periodo_fim: "" });
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateConciliacao = () => {
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    createConciliacao.mutate(form);
    setDlgNova(false);
    setForm({ tipo: "faturas_entregas", nome: "", descricao: "", periodo_inicio: "", periodo_fim: "" });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConciliacao) return;
    
    try {
      await importFile(file, selectedConciliacao.id);
    } catch {
      // Error handled in hook
    }
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openMatchDialog = (item: ItemImportado) => {
    setSelectedItem(item);
    setDlgMatch(true);
  };

  const handleManualMatch = (sistemaId: string, status: "conciliado" | "divergencia") => {
    if (!selectedItem) return;
    manualMatch.mutate({ itemId: selectedItem.id, sistemaId, status });
    setDlgMatch(false);
    setSelectedItem(null);
  };

  const handleIgnoreItem = (itemId: string) => {
    manualMatch.mutate({ itemId, status: "ignorado" });
  };

  const exportToPDF = () => {
    if (!selectedConciliacao) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(18);
    doc.text("Relatório de Conciliação", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(selectedConciliacao.nome, pageWidth / 2, 28, { align: "center" });
    
    // Info
    doc.setFontSize(10);
    doc.text(`Tipo: ${TIPOS_CONCILIACAO.find(t => t.value === selectedConciliacao.tipo)?.label || selectedConciliacao.tipo}`, 14, 40);
    doc.text(`Data: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 46);
    doc.text(`Status: ${selectedConciliacao.status}`, 14, 52);
    
    // Summary
    doc.setFontSize(12);
    doc.text("Resumo", 14, 64);
    doc.setFontSize(10);
    doc.text(`Total Importados: ${stats.total}`, 14, 72);
    doc.text(`Conciliados: ${stats.conciliados}`, 14, 78);
    doc.text(`Divergências: ${stats.divergencias}`, 14, 84);
    doc.text(`Pendentes: ${stats.pendentes}`, 14, 90);
    doc.text(`Diferença Total: ${formatCurrency(stats.diferenca)}`, 14, 96);
    
    // Table - All items
    const tableData = itensImportados.map(item => [
      item.linha_arquivo?.toString() || "-",
      item.referencia_externa || "-",
      (item.descricao || "-").substring(0, 30),
      item.data_documento ? formatDate(item.data_documento) : "-",
      item.transportadora_nome || "-",
      formatCurrency(item.valor),
      item.diferenca_valor !== null ? formatCurrency(item.diferenca_valor) : "-",
      item.status === "pendente" ? "Pendente" : 
        item.status === "conciliado" ? "Conciliado" : 
        item.status === "divergencia" ? "Divergência" : "Ignorado"
    ]);
    
    autoTable(doc, {
      head: [["Linha", "Referência", "Descrição", "Data", "Transportadora", "Valor", "Diferença", "Status"]],
      body: tableData,
      startY: 106,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [59, 130, 246] },
    });
    
    // Divergences section
    const divergencias = itensImportados.filter(i => i.status === "divergencia");
    if (divergencias.length > 0) {
      const finalY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 106;
      
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Detalhamento de Divergências", 14, 20);
      
      const divTableData = divergencias.map(item => [
        item.linha_arquivo?.toString() || "-",
        item.referencia_externa || "-",
        (item.descricao || "-").substring(0, 40),
        formatCurrency(item.valor),
        item.diferenca_valor !== null ? formatCurrency(item.diferenca_valor) : "-",
        item.observacoes || "-"
      ]);
      
      autoTable(doc, {
        head: [["Linha", "Referência", "Descrição", "Valor", "Diferença", "Observações"]],
        body: divTableData,
        startY: 30,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [234, 179, 8] },
      });
    }
    
    doc.save(`conciliacao-${selectedConciliacao.nome.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    toast.success("PDF exportado com sucesso!");
  };

  const exportToExcel = () => {
    if (!selectedConciliacao) return;
    
    // Summary sheet
    const summaryData = [
      ["Relatório de Conciliação"],
      [],
      ["Nome", selectedConciliacao.nome],
      ["Tipo", TIPOS_CONCILIACAO.find(t => t.value === selectedConciliacao.tipo)?.label || selectedConciliacao.tipo],
      ["Status", selectedConciliacao.status],
      ["Data Exportação", format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })],
      [],
      ["Resumo"],
      ["Total Importados", stats.total],
      ["Conciliados", stats.conciliados],
      ["Divergências", stats.divergencias],
      ["Pendentes", stats.pendentes],
      ["Diferença Total", stats.diferenca],
    ];
    
    // Items sheet
    const itemsData = [
      ["Linha", "Referência", "Descrição", "Data", "Transportadora", "Valor", "Diferença", "Status", "Observações"],
      ...itensImportados.map(item => [
        item.linha_arquivo || "",
        item.referencia_externa || "",
        item.descricao || "",
        item.data_documento ? formatDate(item.data_documento) : "",
        item.transportadora_nome || "",
        item.valor,
        item.diferenca_valor ?? "",
        item.status === "pendente" ? "Pendente" : 
          item.status === "conciliado" ? "Conciliado" : 
          item.status === "divergencia" ? "Divergência" : "Ignorado",
        item.observacoes || ""
      ])
    ];
    
    // Divergences sheet
    const divergencias = itensImportados.filter(i => i.status === "divergencia");
    const divData = [
      ["Linha", "Referência", "Descrição", "Valor", "Diferença", "Observações"],
      ...divergencias.map(item => [
        item.linha_arquivo || "",
        item.referencia_externa || "",
        item.descricao || "",
        item.valor,
        item.diferenca_valor ?? "",
        item.observacoes || ""
      ])
    ];
    
    const wb = XLSX.utils.book_new();
    
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");
    
    const wsItems = XLSX.utils.aoa_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(wb, wsItems, "Todos os Itens");
    
    if (divergencias.length > 0) {
      const wsDiv = XLSX.utils.aoa_to_sheet(divData);
      XLSX.utils.book_append_sheet(wb, wsDiv, "Divergências");
    }
    
    XLSX.writeFile(wb, `conciliacao-${selectedConciliacao.nome.replace(/\s+/g, "-").toLowerCase()}.xlsx`);
    toast.success("Excel exportado com sucesso!");
  };

  const filteredItens = filterStatus === "all" 
    ? itensImportados 
    : itensImportados.filter((i) => i.status === filterStatus);

  const stats = selectedConciliacao ? {
    total: selectedConciliacao.total_itens_importados,
    conciliados: selectedConciliacao.total_itens_conciliados,
    divergencias: selectedConciliacao.total_divergencias,
    pendentes: selectedConciliacao.total_itens_importados - selectedConciliacao.total_itens_conciliados - selectedConciliacao.total_divergencias,
    diferenca: selectedConciliacao.diferenca_total,
  } : { total: 0, conciliados: 0, divergencias: 0, pendentes: 0, diferenca: 0 };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-display flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/10">
                <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
              </div>
              Conciliação Financeira
            </h1>
            <p className="text-muted-foreground mt-1">Compare e reconcilie dados financeiros</p>
          </div>
          <Button onClick={() => setDlgNova(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Conciliação
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lista de Conciliações */}
          <div className="lg:col-span-1">
            <div className="card-base">
              <h3 className="font-semibold mb-4">Conciliações</h3>
              {isLoadingConciliacoes ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : conciliacoes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conciliação</p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2 pr-4">
                    {conciliacoes.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelectedConciliacao(c)}
                        className={cn(
                          "p-3 rounded-lg cursor-pointer transition-all border",
                          selectedConciliacao?.id === c.id
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{c.nome}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {TIPOS_CONCILIACAO.find((t) => t.value === c.tipo)?.label}
                            </p>
                          </div>
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", 
                              c.status === "concluida" && "bg-success/20 text-success",
                              c.status === "em_andamento" && "bg-primary/20 text-primary"
                            )}
                          >
                            {c.status === "rascunho" && "Rascunho"}
                            {c.status === "em_andamento" && "Em andamento"}
                            {c.status === "concluida" && "Concluída"}
                            {c.status === "arquivada" && "Arquivada"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{c.total_itens_importados} itens</span>
                          {c.total_divergencias > 0 && (
                            <span className="text-warning">{c.total_divergencias} diverg.</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          {/* Área Principal */}
          <div className="lg:col-span-3">
            {!selectedConciliacao ? (
              <div className="card-base flex flex-col items-center justify-center py-16">
                <FileSpreadsheet className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Selecione uma conciliação ou crie uma nova</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header da Conciliação */}
                <div className="card-base">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{selectedConciliacao.nome}</h2>
                      <p className="text-sm text-muted-foreground">{selectedConciliacao.descricao}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => finalizeConciliacao.mutate(selectedConciliacao.id)}>
                          <FileCheck className="w-4 h-4 mr-2" />Finalizar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive" 
                          onClick={() => deleteConciliacao.mutate(selectedConciliacao.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <FileText className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-lg font-bold">{stats.total}</p>
                      <p className="text-xs text-muted-foreground">Importados</p>
                    </div>
                    <div className="p-3 rounded-lg bg-success/10 text-center">
                      <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-success" />
                      <p className="text-lg font-bold text-success">{stats.conciliados}</p>
                      <p className="text-xs text-muted-foreground">Conciliados</p>
                    </div>
                    <div className="p-3 rounded-lg bg-warning/10 text-center">
                      <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-warning" />
                      <p className="text-lg font-bold text-warning">{stats.divergencias}</p>
                      <p className="text-xs text-muted-foreground">Divergências</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-lg font-bold">{stats.pendentes}</p>
                      <p className="text-xs text-muted-foreground">Pendentes</p>
                    </div>
                    <div className={cn("p-3 rounded-lg text-center", stats.diferenca === 0 ? "bg-success/10" : stats.diferenca > 0 ? "bg-warning/10" : "bg-info/10")}>
                      {stats.diferenca === 0 ? <Minus className="w-5 h-5 mx-auto mb-1 text-success" /> : stats.diferenca > 0 ? <TrendingUp className="w-5 h-5 mx-auto mb-1 text-warning" /> : <TrendingDown className="w-5 h-5 mx-auto mb-1 text-info" />}
                      <p className="text-lg font-bold">{formatCurrency(stats.diferenca)}</p>
                      <p className="text-xs text-muted-foreground">Diferença</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={selectedConciliacao.status === "concluida"}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Importar Arquivo
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => autoMatch.mutate(selectedConciliacao.id)}
                      disabled={autoMatch.isPending || stats.pendentes === 0}
                    >
                      {autoMatch.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                      Matching Automático
                    </Button>
                    
                    <div className="flex-1" />
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" disabled={stats.total === 0}>
                          <Download className="w-4 h-4 mr-2" />
                          Exportar
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={exportToPDF}>
                          <FileText className="w-4 h-4 mr-2" />
                          Exportar PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={exportToExcel}>
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Exportar Excel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Tabela de Itens */}
                <div className="card-base">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Itens Importados</h3>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pendente">Pendentes</SelectItem>
                        <SelectItem value="conciliado">Conciliados</SelectItem>
                        <SelectItem value="divergencia">Divergências</SelectItem>
                        <SelectItem value="ignorado">Ignorados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isLoadingItens ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredItens.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {itensImportados.length === 0 ? "Importe um arquivo para começar" : "Nenhum item com este status"}
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Linha</TableHead>
                            <TableHead>Referência</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Transportadora</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                            <TableHead className="text-right">Diferença</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredItens.map((item) => {
                            const statusConfig = STATUS_COLORS[item.status];
                            const StatusIcon = statusConfig.icon;
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="font-mono text-xs">{item.linha_arquivo}</TableCell>
                                <TableCell className="font-medium">{item.referencia_externa || "-"}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{item.descricao || "-"}</TableCell>
                                <TableCell>{item.data_documento ? formatDate(item.data_documento) : "-"}</TableCell>
                                <TableCell>{item.transportadora_nome || "-"}</TableCell>
                                <TableCell className="text-right font-medium">{formatCurrency(item.valor)}</TableCell>
                                <TableCell className={cn("text-right", item.diferenca_valor && item.diferenca_valor !== 0 && "text-warning font-medium")}>
                                  {item.diferenca_valor !== null ? formatCurrency(item.diferenca_valor) : "-"}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className={cn("gap-1", statusConfig.bg, statusConfig.text)}>
                                    <StatusIcon className="w-3 h-3" />
                                    {item.status === "pendente" && "Pendente"}
                                    {item.status === "conciliado" && "Conciliado"}
                                    {item.status === "divergencia" && "Divergência"}
                                    {item.status === "ignorado" && "Ignorado"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {item.status === "pendente" && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openMatchDialog(item)}>
                                          <ArrowLeftRight className="w-4 h-4 mr-2" />Conciliar Manual
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleIgnoreItem(item.id)}>
                                          <XCircle className="w-4 h-4 mr-2" />Ignorar
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog Nova Conciliação */}
      <Dialog open={dlgNova} onOpenChange={setDlgNova}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Conciliação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as Conciliacao["tipo"] })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_CONCILIACAO.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div>
                        <div className="font-medium">{t.label}</div>
                        <div className="text-xs text-muted-foreground">{t.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input 
                value={form.nome} 
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Conciliação Dezembro 2024"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea 
                value={form.descricao} 
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Detalhes opcionais..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Período Início</Label>
                <Input 
                  type="date" 
                  value={form.periodo_inicio} 
                  onChange={(e) => setForm({ ...form, periodo_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Período Fim</Label>
                <Input 
                  type="date" 
                  value={form.periodo_fim} 
                  onChange={(e) => setForm({ ...form, periodo_fim: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgNova(false)}>Cancelar</Button>
            <Button onClick={handleCreateConciliacao} disabled={createConciliacao.isPending}>
              {createConciliacao.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Match Manual */}
      <Dialog open={dlgMatch} onOpenChange={setDlgMatch}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Conciliar Manualmente</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Item Importado</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedItem.referencia_externa || "Sem referência"}</p>
                    <p className="text-sm text-muted-foreground">{selectedItem.descricao}</p>
                  </div>
                  <p className="text-xl font-bold">{formatCurrency(selectedItem.valor)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Selecione o item do sistema:</p>
                <ScrollArea className="h-[300px] border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Transportadora</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="text-right">Diferença</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entregasSistema.map((e) => {
                        const diferenca = selectedItem.valor - e.valor;
                        const match = Math.abs(diferenca) < 0.01;
                        return (
                          <TableRow key={e.id} className={match ? "bg-success/5" : ""}>
                            <TableCell className="font-medium">{e.numero}</TableCell>
                            <TableCell>{formatDate(e.data)}</TableCell>
                            <TableCell>{e.transportadora}</TableCell>
                            <TableCell className="text-right">{formatCurrency(e.valor)}</TableCell>
                            <TableCell className={cn("text-right", diferenca !== 0 && "text-warning")}>
                              {formatCurrency(diferenca)}
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant={match ? "default" : "outline"}
                                onClick={() => handleManualMatch(e.id, match ? "conciliado" : "divergencia")}
                              >
                                {match ? <Check className="w-4 h-4 mr-1" /> : <AlertTriangle className="w-4 h-4 mr-1" />}
                                {match ? "Conciliar" : "Com Divergência"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

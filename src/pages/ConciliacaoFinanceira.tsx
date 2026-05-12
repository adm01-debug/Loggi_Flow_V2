import { useState, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import {
  FileSpreadsheet, Plus, Upload, Wand2, CheckCircle2, AlertTriangle,
  Clock, MoreVertical, Minus, TrendingUp, TrendingDown, Download, Loader2, FileCheck, FileText
} from "lucide-react";
import { useConciliacao, type Conciliacao, type ItemImportado } from "@/hooks/useConciliacao";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConciliacaoList } from "./conciliacao/ConciliacaoList";
import { ConciliacaoItensTable } from "./conciliacao/ConciliacaoItensTable";
import { NovaConciliacaoDialog, MatchDialog } from "./conciliacao/ConciliacaoDialogs";
import { exportToPDF, exportToExcel } from "./conciliacao/ConciliacaoExport";

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
    if (!form.nome.trim()) { toast.error("Nome é obrigatório"); return; }
    createConciliacao.mutate(form);
    setDlgNova(false);
    setForm({ tipo: "faturas_entregas", nome: "", descricao: "", periodo_inicio: "", periodo_fim: "" });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConciliacao) return;
    try { await importFile(file, selectedConciliacao.id); } catch { /* handled in hook */ }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleManualMatch = (sistemaId: string, status: "conciliado" | "divergencia" | "ignorado", observacoes?: string) => {
    if (!selectedItem) return;
    manualMatch.mutate({ itemId: selectedItem.id, sistemaId, status, observacoes });
    setDlgMatch(false);
    setSelectedItem(null);
  };

  const filteredItens = filterStatus === "all" ? itensImportados : itensImportados.filter((i) => i.status === filterStatus);

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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-display flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-success/10">
                <FileSpreadsheet className="w-6 h-6 text-success" />
              </div>
              Conciliação Financeira
            </h1>
            <p className="text-muted-foreground mt-1">Compare e reconcilie dados financeiros</p>
          </div>
          <Button onClick={() => setDlgNova(true)}><Plus className="w-4 h-4 mr-2" />Nova Conciliação</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <ConciliacaoList
              conciliacoes={conciliacoes}
              isLoading={isLoadingConciliacoes}
              selectedId={selectedConciliacao?.id}
              onSelect={setSelectedConciliacao}
            />
          </div>

          <div className="lg:col-span-3">
            {!selectedConciliacao ? (
              <div className="card-base flex flex-col items-center justify-center py-16">
                <FileSpreadsheet className="w-16 h-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Selecione uma conciliação ou crie uma nova</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="card-base">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{selectedConciliacao.nome}</h2>
                      <p className="text-sm text-muted-foreground">{selectedConciliacao.descricao}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => finalizeConciliacao.mutate(selectedConciliacao.id)}><FileCheck className="w-4 h-4 mr-2" />Finalizar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => deleteConciliacao.mutate(selectedConciliacao.id)}>
                          <FileSpreadsheet className="w-4 h-4 mr-2" />Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50 text-center"><FileText className="w-5 h-5 mx-auto mb-1 text-muted-foreground" /><p className="text-lg font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Importados</p></div>
                    <div className="p-3 rounded-lg bg-success/10 text-center"><CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-success" /><p className="text-lg font-bold text-success">{stats.conciliados}</p><p className="text-xs text-muted-foreground">Conciliados</p></div>
                    <div className="p-3 rounded-lg bg-warning/10 text-center"><AlertTriangle className="w-5 h-5 mx-auto mb-1 text-warning" /><p className="text-lg font-bold text-warning">{stats.divergencias}</p><p className="text-xs text-muted-foreground">Divergências</p></div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center"><Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" /><p className="text-lg font-bold">{stats.pendentes}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
                    <div className={cn("p-3 rounded-lg text-center", stats.diferenca === 0 ? "bg-success/10" : stats.diferenca > 0 ? "bg-warning/10" : "bg-info/10")}>
                      {stats.diferenca === 0 ? <Minus className="w-5 h-5 mx-auto mb-1 text-success" /> : stats.diferenca > 0 ? <TrendingUp className="w-5 h-5 mx-auto mb-1 text-warning" /> : <TrendingDown className="w-5 h-5 mx-auto mb-1 text-info" />}
                      <p className="text-lg font-bold">{formatCurrency(stats.diferenca)}</p>
                      <p className="text-xs text-muted-foreground">Diferença</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={selectedConciliacao.status === "concluida"}>
                      <Upload className="w-4 h-4 mr-2" />Importar Arquivo
                    </Button>
                    <Button variant="outline" onClick={() => autoMatch.mutate(selectedConciliacao.id)} disabled={autoMatch.isPending || stats.pendentes === 0}>
                      {autoMatch.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                      Matching Automático
                    </Button>
                    <div className="flex-1" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="outline" disabled={stats.total === 0}><Download className="w-4 h-4 mr-2" />Exportar</Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => exportToPDF(selectedConciliacao, itensImportados, stats)}><FileText className="w-4 h-4 mr-2" />Exportar PDF</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => exportToExcel(selectedConciliacao, itensImportados, stats)}><FileSpreadsheet className="w-4 h-4 mr-2" />Exportar Excel</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <ConciliacaoItensTable
                  itens={filteredItens}
                  allItens={itensImportados}
                  isLoading={isLoadingItens}
                  filterStatus={filterStatus}
                  onFilterChange={setFilterStatus}
                  onMatchItem={(item) => { setSelectedItem(item); setDlgMatch(true); }}
                  onIgnoreItem={(id) => manualMatch.mutate({ itemId: id, status: "ignorado" })}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <NovaConciliacaoDialog
        open={dlgNova}
        onOpenChange={setDlgNova}
        form={form}
        onFormChange={setForm}
        onCreate={handleCreateConciliacao}
        isPending={createConciliacao.isPending}
      />

      <MatchDialog
        open={dlgMatch}
        onOpenChange={setDlgMatch}
        selectedItem={selectedItem}
        entregasSistema={entregasSistema}
        onMatch={handleManualMatch}
      />
    </MainLayout>
  );
}

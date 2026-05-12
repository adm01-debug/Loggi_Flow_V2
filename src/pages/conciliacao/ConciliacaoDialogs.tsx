import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Check, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Conciliacao, ItemImportado } from "@/hooks/useConciliacao";
import { TIPOS_CONCILIACAO } from "./ConciliacaoList";

interface NovaConciliacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: { tipo: Conciliacao["tipo"]; nome: string; descricao: string; periodo_inicio: string; periodo_fim: string };
  onFormChange: (form: NovaConciliacaoDialogProps["form"]) => void;
  onCreate: () => void;
  isPending: boolean;
}

export function NovaConciliacaoDialog({ open, onOpenChange, form, onFormChange, onCreate, isPending }: NovaConciliacaoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nova Conciliação</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={form.tipo} onValueChange={(v) => onFormChange({ ...form, tipo: v as Conciliacao["tipo"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS_CONCILIACAO.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div>
                      <div className="font-medium">{t.label}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={(e) => onFormChange({ ...form, nome: e.target.value })} placeholder="Ex: Conciliação Dezembro 2024" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={form.descricao} onChange={(e) => onFormChange({ ...form, descricao: e.target.value })} placeholder="Detalhes opcionais..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Período Início</Label>
              <Input type="date" value={form.periodo_inicio} onChange={(e) => onFormChange({ ...form, periodo_inicio: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Período Fim</Label>
              <Input type="date" value={form.periodo_fim} onChange={(e) => onFormChange({ ...form, periodo_fim: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onCreate} disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Criar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface MatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedItem: ItemImportado | null;
  entregasSistema: Array<{ id: string; numero: string; data: string; transportadora: string; valor: number }>;
  onMatch: (sistemaId: string, status: "conciliado" | "divergencia", observacoes?: string) => void;
}

export function MatchDialog({ open, onOpenChange, selectedItem, entregasSistema, onMatch }: MatchDialogProps) {
  const [observacoes, setObservacoes] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader><DialogTitle>Conciliar Manualmente / Gestão de Divergência</DialogTitle></DialogHeader>
        {selectedItem && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Item Importado (Fatura)</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{selectedItem.referencia_externa || "Sem referência"}</p>
                    <p className="text-sm text-muted-foreground">{selectedItem.descricao}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedItem.transportadora_nome}</p>
                  </div>
                  <p className="text-xl font-bold text-primary">{formatCurrency(selectedItem.valor)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações / Justificativa de Divergência</Label>
                <Textarea 
                  placeholder="Ex: Cobrança indevida de reentrega, contestação aberta..." 
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="h-20"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Vincular a Entrega do Sistema:</p>
                <Badge variant="outline">{entregasSistema.length} resultados</Badge>
              </div>
              <ScrollArea className="h-[350px] border rounded-lg">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Transp.</TableHead>
                      <TableHead className="text-right">Valor Sistema</TableHead>
                      <TableHead className="text-right">Diferença</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entregasSistema.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhuma entrega encontrada para o período selecionado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      entregasSistema.map((e) => {
                        const diferenca = selectedItem.valor - e.valor;
                        const match = Math.abs(diferenca) < 0.01;
                        return (
                          <TableRow key={e.id} className={cn(match ? "bg-success/5" : "hover:bg-muted/30 transition-colors")}>
                            <TableCell className="font-medium">{e.numero}</TableCell>
                            <TableCell className="text-xs">{formatDate(e.data)}</TableCell>
                            <TableCell className="text-xs max-w-[100px] truncate">{e.transportadora}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(e.valor)}</TableCell>
                            <TableCell className={cn("text-right font-semibold", diferenca === 0 ? "text-success" : "text-warning")}>
                              {formatCurrency(diferenca)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button 
                                size="sm" 
                                variant={match ? "default" : "outline"} 
                                className={cn(match ? "bg-success hover:bg-success/90" : "border-warning text-warning hover:bg-warning/10")}
                                onClick={() => {
                                  onMatch(e.id, match ? "conciliado" : "divergencia", observacoes);
                                  setObservacoes("");
                                }}
                              >
                                {match ? <Check className="w-4 h-4 mr-1" /> : <AlertTriangle className="w-4 h-4 mr-1" />}
                                {match ? "Aprovar" : "Contestar"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <p className="text-xs text-muted-foreground">
                Dica: O status "Divergência" será aplicado se o valor cotado for diferente do faturado.
              </p>
              <Button variant="ghost" size="sm" onClick={() => {
                onMatch(selectedItem.id, "ignorado", observacoes);
                setObservacoes("");
              }}>
                Ignorar este item
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

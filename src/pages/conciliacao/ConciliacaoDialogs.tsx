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
  onMatch: (sistemaId: string, status: "conciliado" | "divergencia") => void;
}

export function MatchDialog({ open, onOpenChange, selectedItem, entregasSistema, onMatch }: MatchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader><DialogTitle>Conciliar Manualmente</DialogTitle></DialogHeader>
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
                            <Button size="sm" variant={match ? "default" : "outline"} onClick={() => onMatch(e.id, match ? "conciliado" : "divergencia")}>
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
  );
}

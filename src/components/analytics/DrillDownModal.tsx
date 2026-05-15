import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Loader2, Package, Truck, MapPin, Calendar } from "lucide-react";

interface DrillDownData {
  title: string;
  category: string;
  value: string | number;
  items: Array<{
    id: string;
    numero?: string;
    status: string;
    created_at: string;
    endereco?: string;
    [key: string]: unknown;
  }>;
}

interface DrillDownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: DrillDownData | null;
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  entregue: "bg-success/10 text-success border-success/20",
  finalizado: "bg-success/10 text-success border-success/20",
  finalizada: "bg-success/10 text-success border-success/20",
  em_transito: "bg-info/10 text-info border-info/20",
  pendente: "bg-warning/10 text-warning border-warning/20",
  aguardando_producao: "bg-warning/10 text-warning border-warning/20",
  aguardando_liberacao: "bg-warning/10 text-warning border-warning/20",
  solicitada: "bg-info/10 text-info border-info/20",
  ocorrencia: "bg-destructive/10 text-destructive border-destructive/20",
  atrasado: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  entregue: "Entregue",
  finalizado: "Finalizado",
  finalizada: "Finalizada",
  em_transito: "Em Trânsito",
  pendente: "Pendente",
  aguardando_producao: "Aguardando",
  aguardando_liberacao: "Aguardando",
  solicitada: "Solicitada",
  ocorrencia: "Ocorrência",
  atrasado: "Atrasado",
  pronto_despacho: "Pronto Despacho",
  cotacao_frete: "Cotação",
  nf_emitida: "NF Emitida",
  despachado: "Despachado",
  saiu_entrega: "Saiu p/ Entrega",
  chegou_expedicao: "Na Expedição",
  conferencia_ok: "Conferido",
  divergencia: "Divergência",
};

export function DrillDownModal({ open, onOpenChange, data, isLoading }: DrillDownModalProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  const content = (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
        <div className="p-3 rounded-xl bg-primary/10">
          {data?.category === "coletas" ? (
            <Package className="w-6 h-6 text-primary" />
          ) : (
            <Truck className="w-6 h-6 text-primary" />
          )}
        </div>
        <div>
          <p className="text-2xl font-bold">{data?.items.length || 0}</p>
          <p className="text-sm text-muted-foreground">registros encontrados</p>
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="h-[400px]">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        {!isLoading && data?.items && data.items.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="hidden lg:table-cell">Endereço</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {item.numero || item.id.slice(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusColors[item.status] || "bg-muted"}
                    >
                      {statusLabels[item.status] || item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(item.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-muted-foreground max-w-[200px] truncate">
                    {item.endereco && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{item.endereco}</span>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Nenhum registro encontrado
          </div>
        )}
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>{data?.title || "Detalhes"}</SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{data?.title || "Detalhes"}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

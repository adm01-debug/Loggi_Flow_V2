import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CheckCircle2, AlertTriangle, Clock, XCircle, MoreVertical, ArrowLeftRight, Loader2, LucideIcon } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { ItemImportado } from "@/hooks";

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: LucideIcon }> = {
  pendente: { bg: "bg-muted", text: "text-muted-foreground", icon: Clock },
  conciliado: { bg: "bg-success/10", text: "text-success", icon: CheckCircle2 },
  divergencia: { bg: "bg-warning/10", text: "text-warning", icon: AlertTriangle },
  ignorado: { bg: "bg-destructive/10", text: "text-destructive", icon: XCircle },
};

interface ConciliacaoItensTableProps {
  itens: ItemImportado[];
  allItens: ItemImportado[];
  isLoading: boolean;
  filterStatus: string;
  onFilterChange: (status: string) => void;
  onMatchItem: (item: ItemImportado) => void;
  onIgnoreItem: (itemId: string) => void;
}

export function ConciliacaoItensTable({
  itens, allItens, isLoading, filterStatus, onFilterChange, onMatchItem, onIgnoreItem
}: ConciliacaoItensTableProps) {
  return (
    <div className="card-base">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Itens Importados</h3>
        <Select value={filterStatus} onValueChange={onFilterChange}>
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

      {(() => {
        if (isLoading) {
          return (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          );
        }
        if (itens.length === 0) {
          return (
            <div className="text-center py-8 text-muted-foreground">
              {allItens.length === 0 ? "Importe um arquivo para começar" : "Nenhum item com este status"}
            </div>
          );
        }
        return (
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
              {itens.map((item) => {
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onMatchItem(item)}>
                            <ArrowLeftRight className="w-4 h-4 mr-2" />
                            {item.status === "divergencia" ? "Resolver Divergência" : "Conciliar Manual"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onIgnoreItem(item.id)}>
                            <XCircle className="w-4 h-4 mr-2" />Ignorar
                          </DropdownMenuItem>
                          {item.observacoes && (
                            <DropdownMenuItem className="text-xs italic text-muted-foreground" disabled>
                              Obs: {item.observacoes.substring(0, 30)}...
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      )}
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conciliacao } from "@/hooks";

const TIPOS_CONCILIACAO = [
  { value: "faturas_entregas", label: "Faturas x Entregas" },
  { value: "custos_previstos_realizados", label: "Custos Previstos x Realizados" },
  { value: "pagamentos_notas", label: "Pagamentos x Notas Fiscais" },
];

interface ConciliacaoListProps {
  conciliacoes: Conciliacao[];
  isLoading: boolean;
  selectedId: string | undefined;
  onSelect: (c: Conciliacao) => void;
}

export function ConciliacaoList({ conciliacoes, isLoading, selectedId, onSelect }: ConciliacaoListProps) {
  return (
    <div className="card-base">
      <h3 className="font-semibold mb-4">Conciliações</h3>
      {isLoading ? (
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
                onClick={() => onSelect(c)}
                className={cn(
                  "p-3 rounded-lg cursor-pointer transition-all border",
                  selectedId === c.id
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
  );
}

export { TIPOS_CONCILIACAO };

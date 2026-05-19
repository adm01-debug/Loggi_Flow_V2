import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BoxData } from "@/hooks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Package, 
  MapPin, 
  Calendar, 
  User, 
  Truck, 
  AlertTriangle,
  X,
  ArrowRightLeft,
  CheckCircle2
} from "lucide-react";
import { ActivityTimeline } from "@/components/common/ActivityTimeline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAudioFeedback } from "@/hooks";

interface BoxDetailModalProps {
  box: BoxData | null;
  isOpen: boolean;
  onClose: () => void;
  onRemove: (boxNumber: number) => void;
  onToggleCrossDocking?: (deliveryId: string, isCrossDocking: boolean) => void;
}

export function BoxDetailModal({ box, isOpen, onClose, onRemove, onToggleCrossDocking }: BoxDetailModalProps) {
  const audioFeedback = useAudioFeedback();
  if (!box) return null;
  const { playWhoosh, playToggle } = audioFeedback;

  const delivery = box.delivery;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm",
                box.isOccupied && box.isUrgent && "bg-destructive/20 text-destructive border border-destructive/30",
                box.isOccupied && !box.isUrgent && box.isCrossDocking && "bg-info/20 text-info border border-info/30",
                box.isOccupied && !box.isUrgent && !box.isCrossDocking && "bg-warning/20 text-warning border border-warning/30",
                !box.isOccupied && "bg-success/20 text-success border border-success/30"
              )}
            >
              {box.number.toString().padStart(2, "0")}
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold">BOX {box.number.toString().padStart(2, "0")}</span>
              <div className="flex gap-2 mt-1">
                {box.isUrgent && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase font-bold">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Urgente
                  </Badge>
                )}
                {box.isCrossDocking && (
                  <Badge variant="info" className="h-5 px-1.5 text-[10px] uppercase font-bold">
                    <ArrowRightLeft className="w-3 h-3 mr-1" />
                    Cross-docking
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="pt-2">
            {box.isOccupied
              ? "Informações detalhadas da entrega alocada"
              : "Este box está disponível para alocação de novas encomendas"}
          </DialogDescription>
        </DialogHeader>

        {box.isOccupied && delivery && (
          <Tabs defaultValue="info" className="w-full" onValueChange={() => playWhoosh()}>
            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 rounded-lg">
              <TabsTrigger value="info" className="flex items-center gap-2 rounded-md">
                <Package className="w-4 h-4" />
                Informações
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2 rounded-md">
                <History className="w-4 h-4" />
                Rastreabilidade
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="space-y-4 py-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="grid grid-cols-1 gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Número da Entrega</p>
                    <p className="text-base font-bold text-foreground">{delivery.numero_entrega}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Cliente / Destinatário</p>
                    <p className="text-sm font-semibold">{delivery.cliente?.razao_social || "Consumidor Final"}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Destino</p>
                    <p className="text-sm line-clamp-2">{delivery.endereco_entrega}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Previsão</p>
                      <p className="text-sm font-semibold">
                        {delivery.previsao_entrega ? format(new Date(delivery.previsao_entrega), "dd/MM/yyyy", { locale: ptBR }) : "Não definida"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Truck className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Transporte</p>
                      <p className="text-sm font-semibold truncate">{delivery.transportadora?.nome_fantasia || "Pendente"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-info/5 border border-info/20 rounded-xl">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4 text-info" />
                    <Label htmlFor="cross-docking" className="font-bold text-info">Fluxo Cross-docking</Label>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Prioridade máxima de saída sem armazenamento.</p>
                </div>
                <Switch 
                  id="cross-docking" 
                  checked={delivery.is_cross_docking} 
                  onCheckedChange={(checked) => {
                    playToggle(checked);
                    onToggleCrossDocking?.(delivery.id, checked);
                  }}
                />
              </div>

              <div className="flex items-center justify-between px-2">
                <span className="text-sm font-medium text-muted-foreground">Status do Fluxo</span>
                <Badge variant={delivery.status === "pronto_despacho" ? "success" : "secondary"} className="capitalize">
                  {delivery.status === "pronto_despacho" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {delivery.status.replace(/_/g, " ")}
                </Badge>
              </div>
            </TabsContent>

            <TabsContent value="history" className="py-4 animate-in fade-in slide-in-from-right-2">
              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar border rounded-xl p-4 bg-muted/10">
                <ActivityTimeline recordId={delivery.id} tableName="entregas" />
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter className="gap-2 sm:gap-2 mt-4">
          <Button variant="ghost" onClick={onClose} className="flex-1">
            Fechar
          </Button>
          {box.isOccupied && (
            <Button
              variant="destructive"
              onClick={() => onRemove(box.number)}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              Liberar BOX
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

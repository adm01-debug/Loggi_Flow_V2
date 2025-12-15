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
import { Separator } from "@/components/ui/separator";
import { BoxData } from "@/hooks/useBoxManagement";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Package, 
  MapPin, 
  Calendar, 
  User, 
  Truck, 
  AlertTriangle,
  X 
} from "lucide-react";

interface BoxDetailModalProps {
  box: BoxData | null;
  isOpen: boolean;
  onClose: () => void;
  onRemove: (boxNumber: number) => void;
}

export function BoxDetailModal({ box, isOpen, onClose, onRemove }: BoxDetailModalProps) {
  if (!box) return null;

  const delivery = box.delivery;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                box.isOccupied
                  ? box.isUrgent
                    ? "bg-destructive/20 text-destructive"
                    : "bg-warning/20 text-warning"
                  : "bg-success/20 text-success"
              }`}
            >
              {box.number.toString().padStart(2, "0")}
            </div>
            <span>BOX {box.number.toString().padStart(2, "0")}</span>
            {box.isUrgent && (
              <Badge variant="destructive" className="ml-2">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Urgente
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {box.isOccupied
              ? "Este box está ocupado com uma entrega"
              : "Este box está disponível para alocação"}
          </DialogDescription>
        </DialogHeader>

        {box.isOccupied && delivery && (
          <div className="space-y-4">
            <Separator />
            
            {/* Delivery Info */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Package className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{delivery.numero_entrega}</p>
                  <p className="text-xs text-muted-foreground">Número da Entrega</p>
                </div>
              </div>

              {delivery.cliente && (
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{delivery.cliente.razao_social}</p>
                    <p className="text-xs text-muted-foreground">Cliente</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm">{delivery.endereco_entrega}</p>
                  <p className="text-xs text-muted-foreground">Endereço de Entrega</p>
                </div>
              </div>

              {delivery.previsao_entrega && (
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      {format(new Date(delivery.previsao_entrega), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-xs text-muted-foreground">Previsão de Entrega</p>
                  </div>
                </div>
              )}

              {delivery.transportadora && (
                <div className="flex items-start gap-3">
                  <Truck className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{delivery.transportadora.nome_fantasia}</p>
                    <p className="text-xs text-muted-foreground">Transportadora</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="secondary" className="capitalize">
                {delivery.status.replace(/_/g, " ")}
              </Badge>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {box.isOccupied && (
            <Button
              variant="destructive"
              onClick={() => onRemove(box.number)}
            >
              <X className="w-4 h-4 mr-2" />
              Liberar Box
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

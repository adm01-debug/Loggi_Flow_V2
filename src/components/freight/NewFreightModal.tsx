import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Truck,
  MapPin,
  User,
  Package,
  Calendar,
  Zap,
  Plus,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const freightSchema = z.object({
  origin: z.string().min(1, "Selecione a origem"),
  destination: z.string().min(1, "Selecione o destino"),
  driver: z.string().min(1, "Selecione o motorista"),
  items: z.number().min(1, "Informe a quantidade de itens"),
  notes: z.string().max(500, "Máximo de 500 caracteres").optional(),
});

type FreightFormData = z.infer<typeof freightSchema>;

const locations = [
  "CD São Paulo",
  "Loja Centro",
  "Loja Norte",
  "Loja Sul",
  "Loja Leste",
  "Loja Oeste",
];

const drivers = [
  { id: "1", name: "Carlos Mendes", available: true, xp: 2450 },
  { id: "2", name: "Ana Santos", available: true, xp: 1890 },
  { id: "3", name: "Pedro Oliveira", available: false, xp: 3200 },
  { id: "4", name: "Maria Silva", available: true, xp: 1560 },
  { id: "5", name: "João Costa", available: true, xp: 2100 },
  { id: "6", name: "Lucas Pereira", available: false, xp: 980 },
];

interface NewFreightModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewFreightModal({ open, onOpenChange }: NewFreightModalProps) {
  const [estimatedDate, setEstimatedDate] = useState<Date>();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FreightFormData>({
    resolver: zodResolver(freightSchema),
    defaultValues: {
      items: 1,
    },
  });

  const selectedDriver = watch("driver");
  const selectedOrigin = watch("origin");
  const selectedDestination = watch("destination");

  const calculateXP = () => {
    const itemCount = watch("items") || 0;
    const baseXP = 20;
    const itemBonus = Math.floor(itemCount / 10) * 5;
    return baseXP + itemBonus;
  };

  const handleAddItem = () => {
    if (newItem.trim() && !selectedItems.includes(newItem.trim())) {
      setSelectedItems([...selectedItems, newItem.trim()]);
      setNewItem("");
    }
  };

  const handleRemoveItem = (item: string) => {
    setSelectedItems(selectedItems.filter((i) => i !== item));
  };

  const onSubmit = async (data: FreightFormData) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Frete criado com sucesso!",
      description: `Frete de ${data.origin} para ${data.destination} registrado.`,
    });

    reset();
    setSelectedItems([]);
    setEstimatedDate(undefined);
    onOpenChange(false);
  };

  const handleClose = () => {
    reset();
    setSelectedItems([]);
    setEstimatedDate(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-display text-xl">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            Novo Frete Interno
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo frete entre unidades
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {/* Origin & Destination */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Origem
              </Label>
              <Select onValueChange={(value) => setValue("origin", value)}>
                <SelectTrigger className={cn(errors.origin && "border-destructive")}>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  {locations
                    .filter((loc) => loc !== selectedDestination)
                    .map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.origin && (
                <p className="text-xs text-destructive">{errors.origin.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Destino
              </Label>
              <Select onValueChange={(value) => setValue("destination", value)}>
                <SelectTrigger className={cn(errors.destination && "border-destructive")}>
                  <SelectValue placeholder="Selecione o destino" />
                </SelectTrigger>
                <SelectContent>
                  {locations
                    .filter((loc) => loc !== selectedOrigin)
                    .map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.destination && (
                <p className="text-xs text-destructive">{errors.destination.message}</p>
              )}
            </div>
          </div>

          {/* Driver Selection */}
          <div className="space-y-2">
            <Label htmlFor="driver" className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Motorista
            </Label>
            <Select onValueChange={(value) => setValue("driver", value)}>
              <SelectTrigger className={cn(errors.driver && "border-destructive")}>
                <SelectValue placeholder="Selecione o motorista" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem
                    key={driver.id}
                    value={driver.name}
                    disabled={!driver.available}
                  >
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{driver.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            driver.available
                              ? "bg-success/10 text-success border-success/20"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {driver.available ? "Disponível" : "Ocupado"}
                        </Badge>
                        <span className="text-xs text-xp font-medium">
                          {driver.xp} XP
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.driver && (
              <p className="text-xs text-destructive">{errors.driver.message}</p>
            )}
          </div>

          {/* Items Count & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="items" className="flex items-center gap-2">
                <Package className="w-4 h-4 text-muted-foreground" />
                Quantidade de Itens
              </Label>
              <Input
                id="items"
                type="number"
                min={1}
                {...register("items", { valueAsNumber: true })}
                className={cn(errors.items && "border-destructive")}
              />
              {errors.items && (
                <p className="text-xs text-destructive">{errors.items.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Previsão de Entrega
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !estimatedDate && "text-muted-foreground"
                    )}
                  >
                    {estimatedDate
                      ? format(estimatedDate, "dd/MM/yyyy", { locale: ptBR })
                      : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={estimatedDate}
                    onSelect={setEstimatedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Item Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Package className="w-4 h-4 text-muted-foreground" />
              Itens (opcional)
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Adicionar item..."
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddItem();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddItem}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {selectedItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedItems.map((item) => (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="flex items-center gap-1 pr-1"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item)}
                      className="ml-1 hover:bg-accent rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre o frete..."
              {...register("notes")}
              className="resize-none"
              rows={3}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">{errors.notes.message}</p>
            )}
          </div>

          {/* XP Preview */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-xp/10 border border-xp/20">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-xp/20">
                <Zap className="w-5 h-5 text-xp" />
              </div>
              <div>
                <p className="font-medium">Recompensa estimada</p>
                <p className="text-xs text-muted-foreground">
                  Baseado na quantidade de itens
                </p>
              </div>
            </div>
            <span className="text-2xl font-display font-bold text-xp">
              +{calculateXP()} XP
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary press-scale"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Criando...
                </div>
              ) : (
                <>
                  <Truck className="w-4 h-4 mr-2" />
                  Criar Frete
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

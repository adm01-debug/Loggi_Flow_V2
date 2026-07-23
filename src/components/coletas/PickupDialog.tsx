/* eslint-disable max-lines */
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/ui/use-toast";
import {
  Loader2,
  Package,
  Truck,
  Zap,
  Calendar,
  MapPin,
  Search,
  Plus,
  History as HistoryIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Coleta as Pickup, ColetaStatus, ColetaTipo } from "./types";
import { Database } from "@/integrations/supabase/types";

type ColetaInsert = Database["public"]["Tables"]["coletas"]["Insert"];
type ColetaUpdate = Database["public"]["Tables"]["coletas"]["Update"];

interface Fornecedor {
  id: string;
  nome_fantasia: string | null;
  razao_social: string;
}

interface Transportadora {
  id: string;
  nome_fantasia: string;
}

interface PickupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  pickup?: Pickup | null;
}

export function PickupDialog({
  open,
  onOpenChange,
  onSuccess,
  pickup,
}: PickupDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);
  const [isReverse, setIsReverse] = useState(pickup?.is_reverse || false);
  const [isUrgent, setIsUrgent] = useState(pickup?.is_urgent || false);

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: pickup || {
      numero_coleta: "",
      fornecedor_id: "",
      endereco_coleta: "",
      tipo_coleta: "transportadora",
      transportadora_id: "",
      data_prevista_coleta: "",
      qtd_volumes: 0,
      peso_estimado_kg: 0,
      status: "aguardando_liberacao",
      observacoes: "",
      is_reverse: false,
      is_urgent: false,
      custo_estimado: 0,
    },
  });

  useEffect(() => {
    if (open) {
      fetchDropdowns();
      if (pickup) {
        const date = pickup.data_prevista_coleta
          ? new Date(pickup.data_prevista_coleta).toISOString().split("T")[0]
          : "";
        reset({ ...pickup, data_prevista_coleta: date });
      } else {
        const randomId =
          window.crypto.getRandomValues(new Uint32Array(1))[0] % 100000;
        reset({
          numero_coleta: `COL-${randomId}`,
          fornecedor_id: "",
          endereco_coleta: "",
          tipo_coleta: "transportadora",
          transportadora_id: "",
          data_prevista_coleta: "",
          qtd_volumes: 0,
          peso_estimado_kg: 0,
          status: "aguardando_liberacao",
          observacoes: "",
        });
      }
    }
  }, [open, pickup, reset]);

  const fetchDropdowns = async () => {
    const { data: forn } = await supabase
      .from("fornecedores")
      .select("id, nome_fantasia, razao_social")
      .is("deleted_at", null)
      .limit(500);
    const { data: trans } = await supabase
      .from("transportadoras")
      .select("id, nome_fantasia")
      .is("deleted_at", null)
      .limit(200);
    if (forn) setFornecedores(forn);
    if (trans) setTransportadoras(trans);
  };

  const onSubmit = async (values: Partial<Pickup>) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        qtd_volumes: Number(values.qtd_volumes),
        peso_estimado_kg: Number(values.peso_estimado_kg),
        custo_estimado: Number(values.custo_estimado || 0),
        fornecedor_id: values.fornecedor_id || null,
        transportadora_id: values.transportadora_id || null,
        data_prevista_coleta: values.data_prevista_coleta || null,
        is_reverse: isReverse,
        is_urgent: isUrgent,
        observacoes: isReverse
          ? `[LOGÍSTICA_REVERSA] ${values.observacoes}`
          : values.observacoes,
      };

      let error;
      if (pickup?.id) {
        const { error: err } = await supabase
          .from("coletas")
          .update(payload as ColetaUpdate)
          .eq("id", pickup.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from("coletas")
          .insert(payload as ColetaInsert);
        error = err;
      }

      if (error) throw error;

      toast({
        title: pickup ? "Injeção Atualizada" : "Protocolo Injetado",
        description: "O fluxo de coleta foi sincronizado na rede Nexus.",
      });
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const error = err as Error;
      toast({
        title: "Falha Crítica_NODE",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const tipoColeta = watch("tipo_coleta");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] overflow-y-auto bg-black/95 border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 scrollbar-none shadow-2xl">
        <DialogHeader className="mb-8">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-black text-3xl tracking-tighter uppercase italic text-white flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20">
                {pickup ? (
                  <Zap className="w-6 h-6 text-primary" />
                ) : (
                  <Plus className="w-6 h-6 text-primary" />
                )}
              </div>
              {pickup ? "Editar Protocolo" : "Injetar Coleta_Grid"}
            </DialogTitle>
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
              <Button
                type="button"
                variant={!isReverse ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setIsReverse(false)}
                className="h-8 px-4 rounded-full text-[9px] font-black uppercase tracking-widest"
              >
                Inbound
              </Button>
              <Button
                type="button"
                variant={isReverse ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setIsReverse(true)}
                className="h-8 px-4 rounded-full text-[9px] font-black uppercase tracking-widest gap-2"
              >
                <HistoryIcon className="w-3 h-3" /> Reversa
              </Button>
              <Button
                type="button"
                variant={isUrgent ? "destructive" : "ghost"}
                size="sm"
                onClick={() => setIsUrgent(!isUrgent)}
                className={cn(
                  "h-8 px-4 rounded-full text-[9px] font-black uppercase tracking-widest gap-2",
                  isUrgent &&
                    "bg-orange-500 text-white hover:bg-orange-600 border-none",
                )}
              >
                <Zap className="w-3 h-3" /> Urgente
              </Button>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label
                htmlFor="numero_coleta"
                className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40"
              >
                Manifesto_ID
              </Label>
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/10 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                <Input
                  id="numero_coleta"
                  {...register("numero_coleta", { required: true })}
                  className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 font-black uppercase tracking-widest text-sm focus:border-primary/50 transition-all"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label
                htmlFor="status"
                className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40"
              >
                Status Inicial
              </Label>
              <Select
                value={watch("status")}
                onValueChange={(val: ColetaStatus) => setValue("status", val)}
              >
                <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-black uppercase tracking-widest text-[10px]">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/10 backdrop-blur-xl">
                  <SelectItem value="aguardando_liberacao">
                    Aguardando_Node
                  </SelectItem>
                  <SelectItem value="solicitada">Solicitada_Queue</SelectItem>
                  <SelectItem value="em_transito">Em_Transito_Live</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
              Fornecedor_Target
            </Label>
            <Select
              value={watch("fornecedor_id") || ""}
              onValueChange={(val) => setValue("fornecedor_id", val)}
            >
              <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-bold uppercase tracking-widest text-xs">
                <SelectValue placeholder="Selecione o fornecedor na rede" />
              </SelectTrigger>
              <SelectContent>
                {fornecedores.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome_fantasia || f.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="endereco_coleta"
              className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40"
            >
              Endereço de Origem
            </Label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <Input
                id="endereco_coleta"
                {...register("endereco_coleta", { required: true })}
                placeholder="Rua, Número, Bairro, Cidade - UF"
                className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 italic"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
                Protocolo de Transporte
              </Label>
              <Select
                value={watch("tipo_coleta")}
                onValueChange={(val: ColetaTipo) =>
                  setValue("tipo_coleta", val)
                }
              >
                <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-black uppercase tracking-widest text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transportadora">
                    Logística Tradicional
                  </SelectItem>
                  <SelectItem value="lalamove">
                    Lalamove (Uber_Carga)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {tipoColeta === "transportadora" && (
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
                  Transportadora_Node
                </Label>
                <Select
                  value={watch("transportadora_id") || ""}
                  onValueChange={(val) => setValue("transportadora_id", val)}
                >
                  <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 font-black uppercase tracking-widest text-[10px]">
                    <SelectValue placeholder="Selecione a transportadora" />
                  </SelectTrigger>
                  <SelectContent>
                    {transportadoras.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nome_fantasia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-white/[0.02] p-6 rounded-[2rem] border border-white/5">
            <div className="space-y-3">
              <Label
                htmlFor="data_prevista_coleta"
                className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40"
              >
                Data_SLA
              </Label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                <Input
                  id="data_prevista_coleta"
                  type="date"
                  {...register("data_prevista_coleta")}
                  className="h-14 pl-12 rounded-2xl bg-black/40 border-white/10 text-white font-black uppercase text-[11px]"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label
                htmlFor="qtd_volumes"
                className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40"
              >
                Volumes
              </Label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                <Input
                  id="qtd_volumes"
                  type="number"
                  {...register("qtd_volumes")}
                  className="h-14 pl-12 rounded-2xl bg-black/40 border-white/10 font-black text-2xl italic tracking-tighter"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label
                htmlFor="peso_estimado_kg"
                className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40"
              >
                Peso Est. (KG)
              </Label>
              <div className="relative">
                <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                <Input
                  id="peso_estimado_kg"
                  type="number"
                  step="0.01"
                  {...register("peso_estimado_kg")}
                  className="h-14 pl-12 rounded-2xl bg-black/40 border-white/10 font-black text-2xl italic tracking-tighter"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="observacoes"
              className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40"
            >
              Logs_Node Observações
            </Label>
            <Textarea
              id="observacoes"
              {...register("observacoes")}
              placeholder="Informações adicionais para a rede de coleta..."
              className="min-h-[120px] rounded-[1.5rem] bg-white/5 border-white/10 italic text-sm p-6"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2"
            >
              CANCELAR_LOG
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-14 px-12 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-primary text-white shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : (
                <Zap className="w-5 h-5 mr-3 animate-pulse group-hover:scale-125 transition-transform" />
              )}
              {pickup ? "AUTORIZAR_ATUALIZAÇÃO" : "INJETAR_COLETA_REDE"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

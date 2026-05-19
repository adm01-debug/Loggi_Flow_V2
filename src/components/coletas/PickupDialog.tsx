import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
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

export function PickupDialog({ open, onOpenChange, onSuccess, pickup }: PickupDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);

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
    }
  });

  useEffect(() => {
    if (open) {
      fetchDropdowns();
      if (pickup) {
        // Format date for input
        const date = pickup.data_prevista_coleta ? new Date(pickup.data_prevista_coleta).toISOString().split('T')[0] : "";
        reset({ ...pickup, data_prevista_coleta: date });
      } else {
        const randomId = window.crypto.getRandomValues(new Uint32Array(1))[0] % 100000;
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
    const { data: forn } = await supabase.from("fornecedores").select("id, nome_fantasia, razao_social");
    const { data: trans } = await supabase.from("transportadoras").select("id, nome_fantasia");
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
        fornecedor_id: values.fornecedor_id || null,
        transportadora_id: values.transportadora_id || null,
        data_prevista_coleta: values.data_prevista_coleta || null,
      };

      let error;
      if (pickup?.id) {
        const { error: err } = await supabase.from("coletas").update(payload as ColetaUpdate).eq("id", pickup.id);
        error = err;
      } else {
        const { error: err } = await supabase.from("coletas").insert(payload as ColetaInsert);
        error = err;
      }

      if (error) throw error;

      toast({ title: pickup ? "Coleta atualizada" : "Coleta criada", description: "As informações foram salvas com sucesso." });
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const error = err as Error;
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const tipoColeta = watch("tipo_coleta");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-black/95 border-white/10 backdrop-blur-xl rounded-[2.5rem] p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="font-black text-2xl tracking-tighter uppercase italic text-white">{pickup ? "Editar Coleta" : "Nova Coleta_Grid"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_coleta" className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Número da Coleta</Label>
              <Input id="numero_coleta" {...register("numero_coleta", { required: true })} className="h-12 rounded-xl bg-white/5 border-white/10 font-bold uppercase tracking-widest text-xs" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Status Inicial</Label>
              <Select defaultValue={watch("status")} onValueChange={(val: ColetaStatus) => setValue("status", val)}>
                <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 font-black uppercase tracking-widest text-[10px]">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-white/10 backdrop-blur-xl">
                  <SelectItem value="aguardando_liberacao" className="font-black uppercase tracking-widest text-[10px]">Aguardando Liberação</SelectItem>
                  <SelectItem value="solicitada" className="font-black uppercase tracking-widest text-[10px]">Solicitada</SelectItem>
                  <SelectItem value="em_transito" className="font-black uppercase tracking-widest text-[10px]">Em Trânsito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Fornecedor_Node</Label>
            <Select defaultValue={watch("fornecedor_id") || undefined} onValueChange={(val) => setValue("fornecedor_id", val)}>
              <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 font-bold uppercase tracking-widest text-xs">
                <SelectValue placeholder="Selecione o fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {fornecedores.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.nome_fantasia || f.razao_social}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco_coleta" className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Endereço de Coleta</Label>
            <Input id="endereco_coleta" {...register("endereco_coleta", { required: true })} placeholder="Rua, Número, Bairro, Cidade - UF" className="h-12 rounded-xl bg-white/5 border-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Tipo de Transporte</Label>
              <Select defaultValue={watch("tipo_coleta")} onValueChange={(val: ColetaTipo) => setValue("tipo_coleta", val)}>
                <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 font-bold uppercase tracking-widest text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transportadora">Transportadora Tradicional</SelectItem>
                  <SelectItem value="lalamove">Lalamove (Uber de Carga)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {tipoColeta === "transportadora" && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Transportadora</Label>
                <Select defaultValue={watch("transportadora_id") || undefined} onValueChange={(val) => setValue("transportadora_id", val)}>
                  <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 font-bold uppercase tracking-widest text-[10px]">
                    <SelectValue placeholder="Selecione a transportadora" />
                  </SelectTrigger>
                  <SelectContent>
                    {transportadoras.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.nome_fantasia}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_prevista_coleta" className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Data Prevista</Label>
              <Input id="data_prevista_coleta" type="date" {...register("data_prevista_coleta")} className="h-12 rounded-xl bg-white/5 border-white/10 text-white font-bold uppercase" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qtd_volumes" className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Volumes</Label>
              <Input id="qtd_volumes" type="number" {...register("qtd_volumes")} className="h-12 rounded-xl bg-white/5 border-white/10 font-black text-xl italic" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="peso_estimado_kg" className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Peso Est. (KG)</Label>
              <Input id="peso_estimado_kg" type="number" step="0.01" {...register("peso_estimado_kg")} className="h-12 rounded-xl bg-white/5 border-white/10 font-black text-xl italic" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Observações_Logs</Label>
            <Textarea id="observacoes" {...register("observacoes")} placeholder="Informações adicionais para a coleta..." className="min-h-[100px] rounded-2xl bg-white/5 border-white/10 italic" />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] border-2">Cancelar</Button>
            <Button type="submit" disabled={loading} className="h-12 px-10 rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary text-white shadow-xl shadow-primary/20">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {pickup ? "AUTORIZAR_ATUALIZAÇÃO" : "INJETAR_COLETA_REDE"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

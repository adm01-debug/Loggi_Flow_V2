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

interface PickupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  pickup?: any;
}

export function PickupDialog({ open, onOpenChange, onSuccess, pickup }: PickupDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [transportadoras, setTransportadoras] = useState<any[]>([]);

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
        reset({
          numero_coleta: `COL-${Math.floor(Math.random() * 100000)}`,
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

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        qtd_volumes: Number(values.qtd_volumes),
        peso_estimado_kg: Number(values.peso_estimado_kg),
        // If empty string, set to null
        fornecedor_id: values.fornecedor_id || null,
        transportadora_id: values.transportadora_id || null,
        data_prevista_coleta: values.data_prevista_coleta || null,
      };

      let error;
      if (pickup?.id) {
        const { error: err } = await supabase.from("coletas").update(payload).eq("id", pickup.id);
        error = err;
      } else {
        const { error: err } = await supabase.from("coletas").insert(payload);
        error = err;
      }

      if (error) throw error;

      toast({ title: pickup ? "Coleta atualizada" : "Coleta criada", description: "As informações foram salvas com sucesso." });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const tipoColeta = watch("tipo_coleta");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pickup ? "Editar Coleta" : "Nova Coleta"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_coleta">Número da Coleta</Label>
              <Input id="numero_coleta" {...register("numero_coleta", { required: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status Inicial</Label>
              <Select defaultValue={watch("status")} onValueChange={(val) => setValue("status", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aguardando_liberacao">Aguardando Liberação</SelectItem>
                  <SelectItem value="solicitada">Solicitada</SelectItem>
                  <SelectItem value="em_transito">Em Trânsito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Select defaultValue={watch("fornecedor_id")} onValueChange={(val) => setValue("fornecedor_id", val)}>
              <SelectTrigger>
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
            <Label htmlFor="endereco_coleta">Endereço de Coleta</Label>
            <Input id="endereco_coleta" {...register("endereco_coleta", { required: true })} placeholder="Rua, Número, Bairro, Cidade - UF" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Transporte</Label>
              <Select defaultValue={watch("tipo_coleta")} onValueChange={(val) => setValue("tipo_coleta", val)}>
                <SelectTrigger>
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
                <Label>Transportadora</Label>
                <Select defaultValue={watch("transportadora_id")} onValueChange={(val) => setValue("transportadora_id", val)}>
                  <SelectTrigger>
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
              <Label htmlFor="data_prevista_coleta">Data Prevista</Label>
              <Input id="data_prevista_coleta" type="date" {...register("data_prevista_coleta")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qtd_volumes">Volumes</Label>
              <Input id="qtd_volumes" type="number" {...register("qtd_volumes")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="peso_estimado_kg">Peso Est. (kg)</Label>
              <Input id="peso_estimado_kg" type="number" step="0.01" {...register("peso_estimado_kg")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea id="observacoes" {...register("observacoes")} placeholder="Informações adicionais para a coleta..." />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {pickup ? "Atualizar" : "Criar Coleta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
